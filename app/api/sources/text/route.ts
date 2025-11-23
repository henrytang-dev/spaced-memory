import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authSession';
import { initializeFsrsStateForCard } from '@/lib/fsrsScheduler';
import { updateCardEmbedding } from '@/lib/embeddings';

export async function POST(req: Request) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  try {
    const body = await req.json();
    const { text, front, back, tags = [] } = body as {
      text?: string;
      front: string;
      back: string;
      tags?: string[];
    };

    if (!front || !back) {
      return NextResponse.json({ error: 'Front and back are required' }, { status: 400 });
    }

    const source = await prisma.source.create({
      data: {
        userId,
        type: 'TEXT',
        rawText: text ?? front,
        markdown: text ?? front
      }
    });

    const card = await prisma.card.create({
      data: {
        userId,
        sourceId: source.id,
        front,
        back,
        tags
      }
    });

    const updatedCard = await initializeFsrsStateForCard(card.id, card.createdAt);
    await updateCardEmbedding(card.id, userId, `${front}\n\n${back}`);

    return NextResponse.json(updatedCard);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}
