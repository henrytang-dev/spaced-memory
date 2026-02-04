import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authSession';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST() {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const now = new Date();
  const limit = 200;
  let updated = 0;

  try {
    while (true) {
      const overdue = await prisma.card.findMany({
        where: { userId, due: { lt: now } },
        orderBy: { due: 'asc' },
        take: limit
      });
      if (overdue.length === 0) break;

      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      for (const card of overdue) {
        const days = Math.max(card.scheduledDays ?? 1, 1);
        // Rebase so a 1-day interval becomes "due today" (start of day), longer intervals keep spacing
        const newDue = new Date(startOfToday.getTime() + (days - 1) * DAY_MS);
        await prisma.card.update({
          where: { id: card.id },
          data: { due: newDue, scheduledDays: days }
        });
        updated++;
      }
    }

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to rebase due dates' }, { status: 500 });
  }
}
