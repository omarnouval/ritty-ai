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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agentId = BigInt(id);

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
    ] = data as unknown as any[];

    if (!owner || owner === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
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
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
