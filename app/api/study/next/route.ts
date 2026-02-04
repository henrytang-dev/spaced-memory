import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authSession';

export async function GET(req: NextRequest) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') ?? '1');
  const playlistId = url.searchParams.get('playlistId') || undefined;
  // Use end-of-today to avoid timezone drift keeping "today" cards out of the queue
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const cards =
    playlistId && playlistId !== 'all'
      ? await prisma.card.findMany({
          where: {
            userId,
            playlists: {
              some: { playlistId }
            },
            OR: [{ due: { lte: endOfToday } }, { due: null }]
          },
          orderBy: [{ due: 'asc' }, { createdAt: 'asc' }],
          take: limit
        })
      : await prisma.card.findMany({
          where: {
            userId,
            OR: [{ due: { lte: endOfToday } }, { due: null }]
          },
          orderBy: [{ due: 'asc' }, { createdAt: 'asc' }],
          take: limit
        });

  return NextResponse.json({ cards });
}
