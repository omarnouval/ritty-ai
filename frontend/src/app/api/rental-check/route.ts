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
    name: 'getActiveRental',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'agentId', type: 'uint256' },
    ],
    outputs: [
      { name: 'rentalId', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
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

    // Get rental info
    const [rentalId, startTime, endTime, active] = await client.readContract({
      address: MARKETPLACE_ADDRESS,
      abi: RENTAL_ABI,
      functionName: 'getActiveRental',
      args: [address as `0x${string}`, BigInt(agentId)],
    });

    // Get agent name
    let name = `Agent #${agentId}`;
    try {
      const agentData = await client.readContract({
        address: MARKETPLACE_ADDRESS,
        abi: RENTAL_ABI,
        functionName: 'agents',
        args: [BigInt(agentId)],
      });
      name = agentData[2]; // name is 3rd output
    } catch {
      // skip
    }

    return NextResponse.json({
      active,
      rentalId: rentalId.toString(),
      startTime: startTime.toString(),
      endTime: endTime.toString(),
      name,
    });
  } catch (error: any) {
    console.error('Rental check error:', error);
    return NextResponse.json({ active: false, error: 'Internal server error' }, { status: 500 });
  }
}
