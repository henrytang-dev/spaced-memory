import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CardDetailClient from './CardDetailClient';
import { isAuthenticated } from '@/lib/authSession';
import { getSingleUserId } from '@/lib/singleUser';

export default async function CardDetailPage({ params }: { params: { id: string } }) {
  if (!isAuthenticated()) redirect('/auth/login');

  const userId = await getSingleUserId();
  const card = await prisma.card.findFirst({ where: { id: params.id, userId } });
  if (!card) return notFound();

  const playlists = await prisma.playlist.findMany({
    where: { userId },
    include: {
      _count: { select: { cards: true } },
      cards: {
        where: { cardId: params.id },
        select: { cardId: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const serialized = {
    ...card,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
    due: card.due ? card.due.toISOString() : null,
    lastReviewed: card.lastReviewed ? card.lastReviewed.toISOString() : null
  };

  const playlistSummaries = playlists.map((pl) => ({
    id: pl.id,
    name: pl.name,
    cardCount: pl._count.cards,
    hasCard: pl.cards.length > 0
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <CardDetailClient card={serialized} playlists={playlistSummaries} />
    </div>
  );
}
