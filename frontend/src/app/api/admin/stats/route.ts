import { NextResponse } from 'next/server';

const RPC_URL = 'https://rpc.ritualfoundation.org';
const MARKETPLACE_ADDRESS = '0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE';
const PROFILE_ADDRESS = '0xA487bd6BEE21AaE0E1705FE5DDB256Ae6B384c03';

const AGENT_TYPE_LABELS: Record<number, string> = {
  0: 'Research',
  1: 'Trading',
  2: 'Marketing',
  3: 'Content',
  4: 'Coding',
  5: 'Other',
};

// AgentRented event signature
const AGENT_RENTED_TOPIC = '0x' + Buffer.from(
  require('crypto').createHash('sha256').update('AgentRented(uint256,address,uint256,uint256)').digest('hex')
).toString('hex').slice(0, 64);

export async function GET() {
  try {
    const { createPublicClient, http } = await import('viem');

    const client = createPublicClient({
      chain: { id: 1979, name: 'Ritual', rpcUrls: { default: { http: [RPC_URL] } } },
      transport: http(RPC_URL),
    });

    // Get agent count
    const agentCount = await client.readContract({
      address: MARKETPLACE_ADDRESS as `0x${string}`,
      abi: [{ name: 'agentCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }],
      functionName: 'agentCount',
    });

    // Fetch all agents
    const agents = [];
    const allAddresses = new Set<string>();

    for (let i = 0; i < Number(agentCount); i++) {
      try {
        const data = await client.readContract({
          address: MARKETPLACE_ADDRESS as `0x${string}`,
          abi: [{
            name: 'agents', type: 'function', stateMutability: 'view',
            inputs: [{ type: 'uint256' }],
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
          }],
          functionName: 'agents',
          args: [BigInt(i)],
        });

        const [owner, agentContract, name, description, pricePerHour, totalEarnings, totalRentals, rating, ratingCount, isActive, agentType] = data as any;

        agents.push({
          id: i,
          owner,
          agentContract,
          name,
          description,
          pricePerHour: (Number(pricePerHour) / 1e18).toFixed(6),
          totalEarnings: (Number(totalEarnings) / 1e18).toFixed(6),
          totalRentals: Number(totalRentals),
          rating: Number(rating),
          ratingCount: Number(ratingCount),
          isActive,
          agentType: AGENT_TYPE_LABELS[Number(agentType)] || 'Unknown',
        });

        allAddresses.add(owner.toLowerCase());
      } catch {
        // Skip
      }
    }

    // Fetch rental events to find all unique renters
    const currentBlock = await client.getBlockNumber();
    const CHUNK = 99999n;
    const renterAddresses = new Set<string>();
    const rentalEvents: any[] = [];

    // Scan last 5M blocks for events
    const scanFrom = currentBlock > 5000000n ? currentBlock - 5000000n : 0n;

    for (let from = scanFrom; from <= currentBlock; from += CHUNK) {
      const to = from + CHUNK > currentBlock ? currentBlock : from + CHUNK;
      try {
        const logs = await client.getLogs({
          address: MARKETPLACE_ADDRESS as `0x${string}`,
          fromBlock: from,
          toBlock: to,
        });

        for (const log of logs) {
          if (log.topics[0] && log.topics.length >= 2) {
            // Any event with indexed address in topics[1] is likely a user
            const addr = '0x' + (log.topics[1] || '').slice(26);
            if (addr && addr !== '0x0000000000000000000000000000000000000000') {
              renterAddresses.add(addr.toLowerCase());
              allAddresses.add(addr.toLowerCase());
            }
          }
        }
      } catch {
        // Skip chunk errors
      }
    }

    // Fetch usernames for ALL discovered addresses
    const users = [];
    for (const addr of allAddresses) {
      try {
        const username = await client.readContract({
          address: PROFILE_ADDRESS as `0x${string}`,
          abi: [{
            name: 'getUsername', type: 'function', stateMutability: 'view',
            inputs: [{ type: 'address' }],
            outputs: [{ type: 'string' }],
          }],
          functionName: 'getUsername',
          args: [addr as `0x${string}`],
        });

        users.push({
          address: addr,
          username: username || null,
          hasProfile: !!username,
          isOwner: agents.some(a => a.owner.toLowerCase() === addr),
          isRenter: renterAddresses.has(addr),
        });
      } catch {
        users.push({
          address: addr,
          username: null,
          hasProfile: false,
          isOwner: agents.some(a => a.owner.toLowerCase() === addr),
          isRenter: renterAddresses.has(addr),
        });
      }
    }

    return NextResponse.json({
      agents,
      users,
      totalAgents: Number(agentCount),
      totalUsers: users.length,
      usersWithProfile: users.filter(u => u.hasProfile).length,
      uniqueRenters: renterAddresses.size,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
