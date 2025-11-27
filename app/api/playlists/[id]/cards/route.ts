import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/authSession';
import { prisma } from '@/lib/prisma';
import { ensureUnfiledPlaylist } from '@/lib/playlists';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const { cardId } = await req.json();
  if (!cardId) return NextResponse.json({ error: 'cardId required' }, { status: 400 });

  const playlist = await prisma.playlist.findFirst({ where: { id: params.id, userId } });
  if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const unfiled = await ensureUnfiledPlaylist(userId);

  if (playlist.id === unfiled.id) {
    // Assign to unfiled only; remove other playlist links
    await prisma.playlistCard.deleteMany({
      where: { cardId, playlistId: { not: unfiled.id } }
    });
    await prisma.playlistCard.upsert({
      where: { playlistId_cardId: { playlistId: unfiled.id, cardId } },
      update: {},
      create: { playlistId: unfiled.id, cardId }
    });
  } else {
    // Assign to selected playlist and drop unfiled
    await prisma.playlistCard.upsert({
      where: { playlistId_cardId: { playlistId: playlist.id, cardId } },
      update: {},
      create: { playlistId: playlist.id, cardId }
    });
    await prisma.playlistCard.deleteMany({
      where: { cardId, playlistId: unfiled.id }
    });
  }

  revalidatePath('/playlists');
  revalidatePath('/cards');
  revalidatePath('/dashboard');
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const { cardId } = await req.json();
  if (!cardId) return NextResponse.json({ error: 'cardId required' }, { status: 400 });

  const playlist = await prisma.playlist.findFirst({ where: { id: params.id, userId } });
  if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.playlistCard.deleteMany({ where: { playlistId: playlist.id, cardId } });

  const unfiled = await ensureUnfiledPlaylist(userId);
  const remaining = await prisma.playlistCard.count({ where: { cardId, playlistId: { not: unfiled.id } } });
  if (remaining === 0) {
    await prisma.playlistCard.upsert({
      where: { playlistId_cardId: { playlistId: unfiled.id, cardId } },
      update: {},
      create: { playlistId: unfiled.id, cardId }
    });
  }
  revalidatePath('/playlists');
  revalidatePath('/cards');
  revalidatePath('/dashboard');
  return NextResponse.json({ success: true });
}
