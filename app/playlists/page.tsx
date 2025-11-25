import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/authSession';
import { getSingleUserId } from '@/lib/singleUser';
import PlaylistManager from '@/components/PlaylistManager';

export default async function PlaylistsPage() {
  if (!isAuthenticated()) redirect('/auth/login');
  const userId = await getSingleUserId();
  const playlists = await prisma.playlist.findMany({
    where: { userId },
    include: { _count: { select: { cards: true } } },
    orderBy: { updatedAt: 'desc' }
  });

  const serialized = playlists.map((pl) => ({
    id: pl.id,
    name: pl.name,
    description: pl.description,
    cardCount: pl._count.cards,
    createdAt: pl.createdAt.toISOString()
  }));

  return (
    <div className="space-y-6">
      <div className="glass-card">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Decks</p>
        <h1 className="text-3xl font-semibold text-white">Playlists</h1>
        <p className="text-sm text-white/70">Group related questions into focused study sets.</p>
      </div>
      <PlaylistManager initialPlaylists={serialized} />
    </div>
  );
}
