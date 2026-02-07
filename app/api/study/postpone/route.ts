import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authSession';

export async function POST(req: Request) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const { cardId, days = 1 } = (await req.json()) as { cardId?: string; days?: number };
  if (!cardId) return NextResponse.json({ error: 'cardId required' }, { status: 400 });

  const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const now = new Date();
  const postponeMs = Math.max(1, days) * 24 * 60 * 60 * 1000;
  const newDue = new Date(now.getTime() + postponeMs);

  const updated = await prisma.card.update({
    where: { id: card.id },
    data: {
      due: newDue,
      scheduledDays: Math.max(card.scheduledDays ?? 1, Math.ceil(postponeMs / (24 * 60 * 60 * 1000)))
    }
  });

  return NextResponse.json({ card: updated });
}
