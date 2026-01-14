import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/authSession';
import { prisma } from '@/lib/prisma';
import { ensureUnfiledPlaylist } from '@/lib/playlists';

export async function POST(req: NextRequest) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  try {
    const body = await req.json();
    const targetPlaylistId = (body.playlistId as string | undefined) || 'unfiled';
    const cardIds = (body.cardIds as string[]) || [];

    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json({ error: 'cardIds required' }, { status: 400 });
    }

    const cards = await prisma.card.findMany({
      where: { id: { in: cardIds }, userId },
      select: { id: true }
    });
    const validCardIds = cards.map((c) => c.id);
    if (validCardIds.length === 0) {
      return NextResponse.json({ error: 'No matching cards' }, { status: 404 });
    }

    const unfiled = await ensureUnfiledPlaylist(userId);
    const targetId = targetPlaylistId === 'unfiled' ? unfiled.id : targetPlaylistId;

    const targetExists =
      targetId === unfiled.id
        ? true
        : await prisma.playlist.findFirst({ where: { id: targetId, userId }, select: { id: true } });
    if (!targetExists) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Remove all existing playlist memberships for these cards first
      await tx.playlistCard.deleteMany({
        where: { cardId: { in: validCardIds } }
      });

      if (targetId === unfiled.id) {
        // Move to Unfiled only
        await Promise.all(
          validCardIds.map((cardId) =>
            tx.playlistCard.create({
              data: { playlistId: unfiled.id, cardId }
            })
          )
        );
      } else {
        // Assign to the selected playlist only
        await Promise.all(
          validCardIds.map((cardId) =>
            tx.playlistCard.create({
              data: { playlistId: targetId, cardId }
            })
          )
        );
      }
    });

    return NextResponse.json({ success: true, updated: validCardIds.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to assign playlist' }, { status: 500 });
  }
}
