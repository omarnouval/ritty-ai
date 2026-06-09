import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, formatEther } from 'viem';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/lib/contracts';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address: addr } = await params;
    const address = addr as `0x${string}`;

    if (!address || !address.startsWith('0x')) {
      return NextResponse.json(
        { success: false, error: 'Invalid address' },
        { status: 400 }
      );
    }

    // Get user's agent IDs
    const agentIds = await client.readContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'getUserAgents',
      args: [address],
    });

    // Fetch details for each agent
    const agents = await Promise.all(
      (agentIds as bigint[]).map(async (id) => {
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
        ] = data as unknown as any[];

        return {
          id: id.toString(),
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

    // Calculate total earnings
    const totalEarnings = agents.reduce(
      (sum, a) => sum + Number(a.totalEarnings),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        address,
        agents,
        stats: {
          totalAgents: agents.length,
          activeAgents: agents.filter((a) => a.isActive).length,
          totalEarnings: totalEarnings.toFixed(4),
          totalRentals: agents.reduce(
            (sum, a) => sum + Number(a.totalRentals),
            0
          ),
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
