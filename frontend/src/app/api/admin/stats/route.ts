import { NextResponse } from 'next/server';
import { keccak256, toBytes } from 'viem';

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

// AgentRented event signature — keccak256, not SHA-256
const AGENT_RENTED_TOPIC = keccak256(toBytes('AgentRented(uint256,address,uint256,uint256)'));

export async function GET() {
  try {
    const { createPublicClient, http } = await import('viem');

    const client = createPublicClient({
      chain: { id: 1979, name: 'Ritual', nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 }, rpcUrls: { default: { http: [RPC_URL] } } },
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
    const CHUNK = BigInt(99999);
    const renterAddresses = new Set<string>();
    const profileAddresses = new Set<string>();

    // Scan last 5M blocks for events
    const scanFrom = currentBlock > BigInt(5000000) ? currentBlock - BigInt(5000000) : BigInt(0);

    for (let from = scanFrom; from <= currentBlock; from += CHUNK) {
      const to = from + CHUNK > currentBlock ? currentBlock : from + CHUNK;
      try {
        // Scan marketplace events
        const logs = await client.getLogs({
          address: MARKETPLACE_ADDRESS as `0x${string}`,
          fromBlock: from,
          toBlock: to,
        });

        for (const log of logs) {
          if (log.topics[0] && log.topics.length >= 2) {
            const addr = '0x' + (log.topics[1] || '').slice(26);
            const isValidAddr = addr && addr.length === 42 && !addr.match(/^0x0{40}$/i) && !addr.match(/^0x0000000000000000000000000000000000000/i);
            if (isValidAddr) {
              renterAddresses.add(addr.toLowerCase());
              allAddresses.add(addr.toLowerCase());
            }
            if (log.topics[2]) {
              const addr2 = '0x' + (log.topics[2] || '').slice(26);
              const isValidAddr2 = addr2 && addr2.length === 42 && !addr2.match(/^0x0{40}$/i) && !addr2.match(/^0x0000000000000000000000000000000000000/i);
              if (isValidAddr2) {
                renterAddresses.add(addr2.toLowerCase());
                allAddresses.add(addr2.toLowerCase());
              }
            }
          }
        }

        // Scan profile contract events (createProfile calls)
        try {
          const profileLogs = await client.getLogs({
            address: PROFILE_ADDRESS as `0x${string}`,
            fromBlock: from,
            toBlock: to,
          });

          for (const log of profileLogs) {
            if (log.topics.length >= 2) {
              const addr = '0x' + (log.topics[1] || '').slice(26);
              const isValidAddr = addr && addr.length === 42 && !addr.match(/^0x0{40}$/i) && !addr.match(/^0x0000000000000000000000000000000000000/i);
              if (isValidAddr) {
                profileAddresses.add(addr.toLowerCase());
                allAddresses.add(addr.toLowerCase());
              }
            }
          }
        } catch {
          // Profile contract might not exist at this block range
        }
      } catch {
        // Skip chunk errors
      }
    }

    // Fetch usernames for ALL discovered addresses (exclude zero address)
    const users = [];
    for (const addr of allAddresses) {
      if (addr.match(/^0x0{40}$/i)) continue; // Skip zero address
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
          isProfileUser: profileAddresses.has(addr),
        });
      } catch {
        users.push({
          address: addr,
          username: null,
          hasProfile: false,
          isOwner: agents.some(a => a.owner.toLowerCase() === addr),
          isRenter: renterAddresses.has(addr),
          isProfileUser: profileAddresses.has(addr),
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
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
