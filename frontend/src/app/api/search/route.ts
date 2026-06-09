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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const type = searchParams.get('type'); // 'persistent' or 'sovereign'
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sort') || 'rating'; // 'rating', 'price', 'rentals'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get all active agents (up to 100)
    const activeAgentIds = await client.readContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'getActiveAgents',
      args: [BigInt(0), BigInt(100)],
    });

    // Fetch details for each agent
    let agents = await Promise.all(
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
          pricePerHourWei: pricePerHour,
          totalEarnings: formatEther(totalEarnings),
          totalRentals: Number(totalRentals),
          rating: ratingCount > 0 ? Number(rating) / 100 : 0,
          ratingCount: Number(ratingCount),
          isActive,
          agentType: agentType === 0 ? 'sovereign' : 'persistent',
        };
      })
    );

    // Filter by search query
    if (query) {
      agents = agents.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (type) {
      agents = agents.filter((a) => a.agentType === type);
    }

    // Filter by price range
    if (minPrice) {
      agents = agents.filter(
        (a) => Number(a.pricePerHour) >= Number(minPrice)
      );
    }
    if (maxPrice) {
      agents = agents.filter(
        (a) => Number(a.pricePerHour) <= Number(maxPrice)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        agents.sort((a, b) => Number(a.pricePerHourWei) - Number(b.pricePerHourWei));
        break;
      case 'price_desc':
        agents.sort((a, b) => Number(b.pricePerHourWei) - Number(a.pricePerHourWei));
        break;
      case 'rentals':
        agents.sort((a, b) => b.totalRentals - a.totalRentals);
        break;
      case 'rating':
      default:
        agents.sort((a, b) => b.rating - a.rating);
        break;
    }

    // Paginate
    const total = agents.length;
    const start = (page - 1) * limit;
    const paginated = agents.slice(start, start + limit);

    // Remove wei values from response
    const clean = paginated.map(({ pricePerHourWei, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data: clean,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        query,
        type,
        sortBy,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
