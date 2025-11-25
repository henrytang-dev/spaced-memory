import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/authSession';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function GET() {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const playlists = await prisma.playlist.findMany({
    where: { userId },
    include: { _count: { select: { cards: true } } },
    orderBy: { updatedAt: 'desc' }
  });

  return NextResponse.json({
    playlists: playlists.map((pl) => ({
      id: pl.id,
      name: pl.name,
      description: pl.description,
      cardCount: pl._count.cards,
      createdAt: pl.createdAt,
      updatedAt: pl.updatedAt
    }))
  });
}

export async function POST(req: NextRequest) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  try {
    const { name, description } = await req.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const playlist = await prisma.playlist.create({
      data: { userId, name: name.trim(), description: description?.trim() || null }
    });

    revalidatePath('/playlists');
    revalidatePath('/dashboard');
    return NextResponse.json(playlist);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
