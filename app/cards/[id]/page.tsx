import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CardDetailClient from './CardDetailClient';

export default async function CardDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/login');

  const card = await prisma.card.findFirst({ where: { id: params.id, userId: session.user.id } });
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
