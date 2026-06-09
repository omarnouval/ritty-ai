import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, formatEther } from 'viem';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/lib/contracts';

// Ritual Chain config
const ritualChain = {
  id: 1979,
  name: 'Ritual',
  network: 'ritual',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.ritualfoundation.org'] },
  },
};

const client = createPublicClient({
  chain: ritualChain,
  transport: http(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // 'persistent' or 'sovereign'
    const offset = (page - 1) * limit;

    // Get total agent count
    const agentCount = await client.readContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'agentCount',
    });

    // Get active agents
    const activeAgentIds = await client.readContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'getActiveAgents',
      args: [BigInt(offset), BigInt(limit)],
    });

    // Fetch details for each agent
    const agents = await Promise.all(
      (activeAgentIds as bigint[]).map(async (id) => {
        const data = await client.readContract({
          address: MARKETPLACE_ADDRESS,
          abi: MARKETPLACE_ABI,
          functionName: 'agents',
          args: [id],
        });

        const [
          owner,
          agentContract,
          name,
          description,
          pricePerHour,
          totalEarnings,
          totalRentals,
          rating,
          ratingCount,
          isActive,
          agentType,
        ] = data as any[];

        return {
          id: id.toString(),
          owner,
          agentContract,
          name,
          description,
          pricePerHour: formatEther(pricePerHour),
          totalEarnings: formatEther(totalEarnings),
          totalRentals: totalRentals.toString(),
          rating: ratingCount > 0 ? (Number(rating) / 100).toFixed(1) : '0',
          ratingCount: ratingCount.toString(),
          isActive,
          agentType: agentType === 0 ? 'sovereign' : 'persistent',
        };
      })
    );

    // Filter by type if specified
    const filtered = type
      ? agents.filter((a) => a.agentType === type)
      : agents;

    return NextResponse.json({
      success: true,
      data: filtered,
      meta: {
        page,
        limit,
        total: Number(agentCount),
        totalPages: Math.ceil(Number(agentCount) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
