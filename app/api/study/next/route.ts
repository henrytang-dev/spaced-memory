import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authSession';

export async function GET(req: NextRequest) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '1'), 200);
  const dailyCap = Math.min(Number(url.searchParams.get('cap') ?? '60'), 500);
  const playlistId = url.searchParams.get('playlistId') || undefined;
  // Use end-of-today to avoid timezone drift keeping "today" cards out of the queue
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const tomorrow = new Date(endOfToday.getTime() + 24 * 60 * 60 * 1000);

  const baseWhere =
    playlistId && playlistId !== 'all'
      ? {
          userId,
          playlists: { some: { playlistId } },
          OR: [{ due: { lte: endOfToday } }, { due: null }]
        }
      : {
          userId,
          OR: [{ due: { lte: endOfToday } }, { due: null }]
        };

  // Fetch all due IDs to enforce daily cap + roll-over
  const dueIds = await prisma.card.findMany({
    where: baseWhere,
    select: { id: true },
    orderBy: [{ due: 'asc' }, { createdAt: 'asc' }]
  });

  if (dueIds.length > dailyCap) {
    const rolloverIds = dueIds.slice(dailyCap).map((c) => c.id);
    if (rolloverIds.length > 0) {
      await prisma.card.updateMany({
        where: { id: { in: rolloverIds } },
        data: { due: tomorrow }
      });
    }
  }

  const cards = await prisma.card.findMany({
    where: baseWhere,
    orderBy: [{ due: 'asc' }, { createdAt: 'asc' }],
    take: Math.min(limit, dailyCap)
  });

  return NextResponse.json({ cards });
}
