import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/apiAuth';
import { embedText, searchByEmbedding } from '@/lib/embeddings';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const query = new URL(req.url).searchParams.get('q');
  if (!query) return NextResponse.json({ results: [] });

  try {
    const embedding = await embedText(query);
    const matches = await searchByEmbedding(userId, embedding, 10);

    const cards = await prisma.card.findMany({
      where: { id: { in: matches.map((m) => m.cardId) } }
    });
    const cardMap = new Map(cards.map((c) => [c.id, c]));
    const results = matches
      .map((m) => ({ card: cardMap.get(m.cardId), score: m.score }))
      .filter((r) => r.card);

    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
