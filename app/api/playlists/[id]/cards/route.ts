import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/authSession';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const { cardId } = await req.json();
  if (!cardId) return NextResponse.json({ error: 'cardId required' }, { status: 400 });

  const playlist = await prisma.playlist.findFirst({ where: { id: params.id, userId } });
  if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.playlistCard.upsert({
    where: { playlistId_cardId: { playlistId: playlist.id, cardId } },
    update: {},
    create: { playlistId: playlist.id, cardId }
  });

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
  revalidatePath('/playlists');
  revalidatePath('/cards');
  revalidatePath('/dashboard');
  return NextResponse.json({ success: true });
}
