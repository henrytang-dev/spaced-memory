import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authSession';

export async function GET(req: NextRequest) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') ?? '1');
  const playlistId = url.searchParams.get('playlistId') || undefined;
  const now = new Date();

  const cards =
    playlistId && playlistId !== 'all'
      ? await prisma.card.findMany({
          where: {
            userId,
            playlists: {
              some: { playlistId }
            },
            OR: [{ due: { lte: now } }, { due: null }]
          },
          orderBy: [{ due: 'asc' }, { createdAt: 'asc' }],
          take: limit
        })
      : await prisma.card.findMany({
          where: {
            userId,
            OR: [{ due: { lte: now } }, { due: null }]
          },
          orderBy: [{ due: 'asc' }, { createdAt: 'asc' }],
          take: limit
        });

  return NextResponse.json({ cards });
}
