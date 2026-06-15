import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';

const ritualChain = {
  id: 1979,
  name: 'Ritual',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ritualfoundation.org'] } },
};

const MARKETPLACE_ADDRESS = '0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE' as `0x${string}`;

const RENTAL_ABI = [
  {
    name: 'agents',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'agentContract', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'pricePerHour', type: 'uint256' },
      { name: 'totalEarnings', type: 'uint256' },
      { name: 'totalRentals', type: 'uint256' },
      { name: 'rating', type: 'uint256' },
      { name: 'ratingCount', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'agentType', type: 'uint8' },
    ],
  },
  {
    type: 'event',
    name: 'AgentRented',
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: true, name: 'renter', type: 'address' },
      { name: 'duration', type: 'uint256' },
      { name: 'totalPaid', type: 'uint256' },
    ],
  },
] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const agentId = searchParams.get('agentId');

    if (!address || agentId === null) {
      return NextResponse.json({ active: false, error: 'Missing address or agentId' }, { status: 400 });
    }

    const client = createPublicClient({
      chain: ritualChain,
      transport: http(),
    });

    // Get agent name first
    let name = `Agent #${agentId}`;
    try {
      const agentData = await client.readContract({
        address: MARKETPLACE_ADDRESS,
        abi: RENTAL_ABI,
        functionName: 'agents',
        args: [BigInt(agentId)],
      });
      if (agentData[2]) name = agentData[2];
    } catch {
      // skip
    }

    // WORKAROUND: getActiveRental always reverts on Ritual Chain
    // because block.timestamp is in milliseconds but contract adds seconds.
    // Use AgentRented events instead to detect active rentals.
    
    try {
      const latest = await client.getBlockNumber();
      // Search last 100k blocks for rental events by this user+agent
      const fromBlock = latest - BigInt(100000);
      
      const logs = await client.getLogs({
        address: MARKETPLACE_ADDRESS,
        event: {
          type: 'event',
          name: 'AgentRented',
          inputs: [
            { indexed: true, name: 'agentId', type: 'uint256' },
            { indexed: true, name: 'renter', type: 'address' },
            { name: 'duration', type: 'uint256' },
            { name: 'totalPaid', type: 'uint256' },
          ],
        },
        args: {
          renter: address as `0x${string}`,
          agentId: BigInt(agentId),
        },
        fromBlock,
        toBlock: latest,
      });

      if (logs.length === 0) {
        return NextResponse.json({ active: false, rentalId: '0', startTime: '0', endTime: '0', name });
      }

      // Get the most recent rental event
      const lastLog = logs[logs.length - 1];
      const block = await client.getBlock({ blockNumber: lastLog.blockNumber });
      const duration = Number(lastLog.args.duration);
      
      // Ritual Chain: block.timestamp is in milliseconds
      // Contract calculates: endTime = block.timestamp (ms) + duration * 3600 (seconds!)
      // This means rental only lasts `duration * 3600` milliseconds (not seconds)
      // So 1-hour rental actually lasts 3.6 seconds on chain.
      //
      // WORKAROUND: Calculate real end time using duration in HOURS
      const blockTimestampMs = Number(block.timestamp);
      const rentalStartMs = blockTimestampMs;
      const rentalEndMs = rentalStartMs + (duration * 3600 * 1000); // Convert hours to ms properly
      const nowMs = Date.now();
      
      const isActive = nowMs < rentalEndMs;
      
      if (!isActive) {
        return NextResponse.json({ 
          active: false, 
          rentalId: lastLog.transactionHash, 
          startTime: Math.floor(rentalStartMs / 1000).toString(), 
          endTime: Math.floor(rentalEndMs / 1000).toString(), 
          name,
          expired: true,
        });
      }

      return NextResponse.json({
        active: true,
        rentalId: lastLog.transactionHash,
        startTime: Math.floor(rentalStartMs / 1000).toString(),
        endTime: Math.floor(rentalEndMs / 1000).toString(),
        name,
      });
    } catch (err: any) {
      console.error('Event scan error:', err);
      return NextResponse.json({ active: false, rentalId: '0', startTime: '0', endTime: '0', name });
    }
  } catch (error: any) {
    console.error('Rental check error:', error);
    return NextResponse.json({ active: false, error: 'Internal server error' }, { status: 500 });
  }
}
