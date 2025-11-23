import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const limit = Number(new URL(req.url).searchParams.get('limit') ?? '1');
  const now = new Date();

  const cards = await prisma.card.findMany({
    where: {
      userId,
      OR: [{ due: { lte: now } }, { due: null }]
    },
    orderBy: [{ due: 'asc' }, { createdAt: 'asc' }],
    take: limit
  });

  return NextResponse.json({ cards });
}
