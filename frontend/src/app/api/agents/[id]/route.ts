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
  { params }: { params: { id: string } }
) {
  try {
    const agentId = BigInt(params.id);

    // Get agent details
    const data = await client.readContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'agents',
      args: [agentId],
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

    if (!owner || owner === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get rental history
    let rentals: any[] = [];
    try {
      const rentalData = await client.readContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'getRentals',
        args: [agentId],
      });

      rentals = (rentalData as any[]).map((r: any) => ({
        renter: r.renter,
        startTime: Number(r.startTime),
        endTime: Number(r.endTime),
        totalPaid: formatEther(r.totalPaid),
        isActive: r.isActive && Date.now() / 1000 < Number(r.endTime),
      }));
    } catch {
      // getRentals might not exist on old contract
    }

    return NextResponse.json({
      success: true,
      data: {
        id: params.id,
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
        rentals,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
