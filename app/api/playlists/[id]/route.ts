import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/authSession';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const playlist = await prisma.playlist.findFirst({
    where: { id: params.id, userId },
    include: {
      cards: {
        include: { card: true }
      }
    }
  });

  if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(playlist);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const playlist = await prisma.playlist.findFirst({ where: { id: params.id, userId } });
  if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { name, description } = await req.json();
  const updated = await prisma.playlist.update({
    where: { id: params.id },
    data: {
      name: name?.trim() || playlist.name,
      description: description?.trim() ?? playlist.description
    }
  });

  revalidatePath('/playlists');
  revalidatePath('/dashboard');
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const playlist = await prisma.playlist.findFirst({ where: { id: params.id, userId } });
  if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.playlist.delete({ where: { id: params.id } });
  revalidatePath('/playlists');
  revalidatePath('/dashboard');
  return NextResponse.json({ success: true });
}
