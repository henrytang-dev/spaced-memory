import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/authSession';
import { getSingleUserId } from '@/lib/singleUser';
import MarkdownView from '@/components/MarkdownView';
import PlaylistCardsClient from './PlaylistCardsClient';

export default async function PlaylistDetailPage({ params }: { params: { id: string } }) {
  if (!isAuthenticated()) redirect('/auth/login');
  const userId = await getSingleUserId();

  const playlist = await prisma.playlist.findFirst({
    where: { id: params.id, userId },
    include: {
      cards: {
        include: {
          card: true
        }
      }
    }
  });

  if (!playlist) return notFound();

  const cards = playlist.cards.map((c) => ({
    id: c.cardId,
    front: c.card.front,
    tags: c.card.tags
  }));

  return (
    <div className="space-y-6">
      <div className="glass-card">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Deck</p>
        <h1 className="text-3xl font-semibold text-white">{playlist.name}</h1>
        {playlist.description && <p className="text-sm text-white/70">{playlist.description}</p>}
        <p className="text-xs text-white/60">{playlist.cards.length} cards</p>
        <a
          href={`/study?playlistId=${playlist.id}&playlistName=${encodeURIComponent(playlist.name)}`}
          className="btn-primary mt-3 inline-block px-4 py-2 text-sm"
        >
          Review this playlist
        </a>
      </div>
      <PlaylistCardsClient cards={cards} playlistId={playlist.id} playlistName={playlist.name} />
    </div>
  );
}
