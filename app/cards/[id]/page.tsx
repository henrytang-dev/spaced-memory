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

  const serialized = {
    ...card,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
    due: card.due ? card.due.toISOString() : null,
    lastReviewed: card.lastReviewed ? card.lastReviewed.toISOString() : null
  };

  return (
    <div className="mx-auto max-w-4xl">
      <CardDetailClient card={serialized} />
    </div>
  );
}
