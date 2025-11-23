import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CardsClient from './CardsClient';

export default async function CardsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/login');

  const cards = await prisma.card.findMany({
    where: { userId: session.user.id },
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
