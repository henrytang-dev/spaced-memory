import type { Metadata } from 'next';
import '../styles/globals.css';
import { isAuthenticated } from '@/lib/authSession';
import IconRail from '@/components/IconRail';
import LibrarySidebar from '@/components/LibrarySidebar';
import PlaybackBar from '@/components/PlaybackBar';
import { prisma } from '@/lib/prisma';
import { getSingleUserId } from '@/lib/singleUser';
import MobileNav from '@/components/MobileNav';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: 'Spaced Memory',
  description: 'Personal spaced repetition notebook'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const authenticated = isAuthenticated();
  const data = authenticated ? await gatherLayoutData() : null;
  const pathname = headers().get('x-pathname') || '';
  const showPlayback = authenticated && !pathname.startsWith('/study');

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen text-white">
        {!authenticated ? (
          <div className="flex min-h-screen items-center justify-center px-4 py-6">
            <div className="w-full max-w-2xl">{children}</div>
          </div>
        ) : (
          <div className="min-h-screen lg:h-screen px-2 py-2 sm:px-4">
            <div className="shell mx-auto flex h-full w-full max-w-[calc(100vw-32px)] lg:max-h-[calc(100vh-32px)] rounded-[28px] p-3 sm:p-5">
              <div className="flex h-full w-full flex-col gap-3 lg:grid lg:grid-cols-[70px_240px_1fr] lg:gap-4">
                <div className="hidden lg:block">
                  <IconRail />
                </div>
                <div className="hidden lg:flex">
                  <LibrarySidebar authenticated={authenticated} stats={data?.stats} playlists={data?.playlistsSidebar} />
                </div>
                <div className="flex h-full min-h-0 flex-col gap-3 overflow-visible rounded-[28px] border border-white/10 bg-white/10 px-3 py-4 sm:px-5 sm:py-5 backdrop-blur-2xl pb-16">
                  <div className="lg:hidden">
                    <MobileNav />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-2xl font-semibold text-white">Spaced Memory</p>
                      <p className="text-sm text-white/60">Personal review cockpit</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/70">
                    <span>🔍</span>
                    <input
                      type="text"
                      placeholder="Search cards or decks"
                      className="flex-1 bg-transparent text-white placeholder:text-white/60 focus:outline-none"
                    />
                  </div>

                  <div className="mt-1 flex-1 min-h-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                    <div className="h-full overflow-auto px-3 py-4 sm:px-5">{children}</div>
                  </div>

                  {showPlayback && <PlaybackBar />}
                </div>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}

type LayoutData = {
  stats: {
    totalCards: number;
    dueToday: number;
    newThisWeek: number;
    tags: number;
    playlists: number;
  };
  playlistsSidebar: { id: string; name: string; description: string | null; cardCount: number }[];
};

async function gatherLayoutData(): Promise<LayoutData> {
  const userId = await getSingleUserId();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7);

  const [totalCards, dueToday, newCards, playlistRows, tagRows] = await Promise.all([
    prisma.card.count({ where: { userId } }),
    prisma.card.count({ where: { userId, OR: [{ due: { lte: now } }, { due: null }] } }),
    prisma.card.count({ where: { userId, createdAt: { gte: weekAgo } } }),
    prisma.playlist.findMany({
      where: { userId },
      include: { _count: { select: { cards: true } } },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.card.findMany({ where: { userId }, select: { tags: true } })
  ]);

  const tagSet = new Set(tagRows.flatMap((c) => c.tags));
  const playlists = playlistRows.map((pl) => ({
    id: pl.id,
    name: pl.name,
    description: pl.description,
    cardCount: pl._count.cards
  }));

  return {
    stats: {
      totalCards,
      dueToday,
      newThisWeek: newCards,
      tags: tagSet.size,
      playlists: playlists.length
    },
    playlistsSidebar: playlists.slice(0, 6)
  };
}
