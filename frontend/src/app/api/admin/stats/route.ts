import { NextResponse } from 'next/server';

const RPC_URL = 'https://rpc.ritualfoundation.org';
const MARKETPLACE_ADDRESS = '0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE';
const PROFILE_ADDRESS = '0xA487bd6BEE21AaE0E1705FE5DDB256Ae6B384c03';

const AGENT_ABI = {
  name: 'agents',
  type: 'function',
  stateMutability: 'view',
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
};

const AGENT_TYPE_LABELS: Record<number, string> = {
  0: 'Research',
  1: 'Trading',
  2: 'Marketing',
  3: 'Content',
  4: 'Coding',
  5: 'Other',
};

async function rpcCall(method: string, params: any[]) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

// Encode function call
function encodeFunction(fn: typeof AGENT_ABI, args: any[]): string {
  // Use ethers.js or manual encoding — for now use a simple approach
  // We'll use the client-side viem for complex encoding
  return '0x';
}

export async function GET() {
  try {
    // Import viem server-side
    const { createPublicClient, http, parseAbi } = await import('viem');

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
    const ownerAddresses = new Set<string>();

    for (let i = 0; i < Number(agentCount); i++) {
      try {
        const data = await client.readContract({
          address: MARKETPLACE_ADDRESS as `0x${string}`,
          abi: [AGENT_ABI] as any,
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

        ownerAddresses.add(owner.toLowerCase());
      } catch (e) {
        // Skip
      }
    }

    // Fetch usernames
    const users = [];
    for (const addr of ownerAddresses) {
      try {
        const username = await client.readContract({
          address: PROFILE_ADDRESS as `0x${string}`,
          abi: [{
            name: 'getUsername',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ type: 'address' }],
            outputs: [{ type: 'string' }],
          }],
          functionName: 'getUsername',
          args: [addr as `0x${string}`],
        });

        if (username) {
          users.push({ address: addr, username });
        }
      } catch {
        // No profile
      }
    }

    return NextResponse.json({ agents, users, totalAgents: Number(agentCount) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
