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

  const memberships = await prisma.playlistCard.findMany({
    where: { cardId: { in: cards.map((c) => c.id) } },
    include: { playlist: true }
  });

  const playlistByCard = new Map<string, string>();
  memberships.forEach((m) => {
    const name = m.playlist?.name || 'Unfiled';
    if (!playlistByCard.has(m.cardId) || name === 'Unfiled') {
      playlistByCard.set(m.cardId, name);
    }
  });

  const serialized = cards.map((c) => ({
    ...c,
    playlist: playlistByCard.get(c.id) || 'Unfiled',
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
