import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/authSession';
import { getSingleUserId } from '@/lib/singleUser';
import MarkdownView from '@/components/MarkdownView';

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
      <div className="glass-card space-y-3">
        {playlist.cards.length === 0 ? (
          <p className="text-sm text-white/70">No cards yet.</p>
        ) : (
          playlist.cards.map((entry) => (
            <a
              key={entry.cardId}
              href={`/cards/${entry.cardId}`}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10"
            >
              <div className="mb-1 flex items-center gap-2 text-[11px] uppercase text-white/60">
                <span className="rounded-full border border-white/20 px-2 py-0.5">
                  {playlist.name || 'Playlist'}
                </span>
                {entry.card.tags.length > 0 && (
                  <span className="hidden sm:inline">{entry.card.tags.join(', ')}</span>
                )}
              </div>
              <div className="max-h-20 overflow-hidden text-sm font-semibold text-white">
                <MarkdownView content={entry.card.front} />
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
