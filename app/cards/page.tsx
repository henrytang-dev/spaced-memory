import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CardsClient from './CardsClient';
import { isAuthenticated } from '@/lib/authSession';
import { getSingleUserId } from '@/lib/singleUser';

export default async function CardsPage() {
  if (!isAuthenticated()) redirect('/auth/login');
  const userId = await getSingleUserId();
  const cards = await prisma.card.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const serialized = cards.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    due: c.due ? c.due.toISOString() : null,
    lastReviewed: c.lastReviewed ? c.lastReviewed.toISOString() : null
  }));

  return (
    <div className="space-y-6">
      <CardsClient initialCards={serialized} />
    </div>
  );
}
