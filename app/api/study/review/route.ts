import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/apiAuth';
import { applyReview, Rating } from '@/lib/fsrsScheduler';

export async function POST(req: Request) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  try {
    const { cardId, rating, now } = await req.json();
    if (!cardId || !rating) {
      return NextResponse.json({ error: 'cardId and rating are required' }, { status: 400 });
    }

    const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    const ratingValue = Rating[rating as keyof typeof Rating];
    if (ratingValue === undefined) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    const result = await applyReview(card, ratingValue, now ? new Date(now) : new Date());
    return NextResponse.json({ card: result.updatedCard, reviewLog: result.reviewLog });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to record review' }, { status: 500 });
  }
}
