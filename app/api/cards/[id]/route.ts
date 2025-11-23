import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authSession';
import { updateCardEmbedding } from '@/lib/embeddings';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const card = await prisma.card.findFirst({ where: { id: params.id, userId } });
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(card);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const body = await req.json();
  const { front, back } = body;
  const existing = await prisma.card.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const card = await prisma.card.update({
    where: { id: params.id },
    data: {
      front: front ?? existing.front,
      back: back ?? existing.back,
      tags: (body.tags as string[] | undefined) ?? existing.tags
    }
  });

  await updateCardEmbedding(card.id, userId, `${card.front}\n\n${card.back}`);

  return NextResponse.json(card);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const existing = await prisma.card.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.card.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
