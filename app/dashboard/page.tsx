import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/authSession';
import { getSingleUserId } from '@/lib/singleUser';
import MarkdownView from '@/components/MarkdownView';
import HighlightsGrid from '@/components/HighlightsGrid';
import DeckPreview from '@/components/DeckPreview';

export default async function DashboardPage() {
  if (!isAuthenticated()) redirect('/auth/login');
  const userId = await getSingleUserId();
  const now = new Date();

  const [dueCount, totalCards, recentReviews, latestCards, latestLogs, playlistRows] = await Promise.all([
    prisma.card.count({ where: { userId, OR: [{ due: { lte: now } }, { due: null }] } }),
    prisma.card.count({ where: { userId } }),
    prisma.reviewLog.count({ where: { userId, reviewedAt: { gte: new Date(now.getTime() - 1000 * 60 * 60 * 24) } } }),
    prisma.card.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, front: true, tags: true, createdAt: true },
      take: 4
    }),
    prisma.reviewLog.findMany({
      where: { userId },
      orderBy: { reviewedAt: 'desc' },
      include: { card: { select: { front: true } } },
      take: 4
    }),
    prisma.playlist.findMany({
      where: { userId },
      include: { _count: { select: { cards: true } } },
      orderBy: { updatedAt: 'desc' }
    })
  ]);

  const metrics = [
    { label: 'Due now', value: dueCount },
    { label: 'Total', value: totalCards },
    { label: '24h reviews', value: recentReviews }
  ];

  const highlights = [
    { title: 'Total cards', value: totalCards.toString(), subtitle: 'All time' },
    { title: 'Due today', value: dueCount.toString(), subtitle: 'Waiting reviews' },
    { title: 'New this week', value: latestCards.length.toString(), subtitle: 'Recently added' },
    { title: 'Playlists', value: playlistRows.length.toString(), subtitle: 'Deck collections' }
  ];

  const playlistPreview = playlistRows.map((pl) => ({
    id: pl.id,
    name: pl.name,
    description: pl.description,
    cardCount: pl._count.cards
  }));

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card overflow-hidden hidden lg:block">
          <div className="relative z-10 space-y-5">
            <span className="pill">Cognitive console</span>
            <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
              Conduct your reviews inside a{' '}
              <span className="text-transparent bg-gradient-to-r from-accent via-cyan-200 to-purple-300 bg-clip-text">
                lucid glass cockpit
              </span>
            </h1>
            <p className="text-white/70">
              FSRS keeps the cadence human. Mathpix OCR, embeddings, and review logs flow into a single private
              notebook.
            </p>
          </div>
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -right-20 top-10 h-48 w-48 rounded-full bg-accent blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-midnight-900 to-transparent" />
          </div>
        </div>
        <div className="spotlight flex flex-col gap-4 text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">Now playing</p>
          <div className="space-y-2">
            <p className="text-4xl font-semibold">{dueCount > 0 ? 'Cards in queue' : 'All clear'}</p>
            <p className="text-sm text-white/70">FSRS recalibrates after each answer. Keep the streak alive.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Reviews (24h)</p>
            <p className="mt-2 text-3xl font-semibold">{recentReviews}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white">
        <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:pb-0">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="min-w-[140px] rounded-2xl border border-white/5 bg-white/0 px-3 py-3 text-left"
            >
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">{metric.label}</p>
              <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
            </div>
          ))}
          <div className="min-w-[180px] rounded-2xl border border-white/5 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">Search</p>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white/70">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search"
                className="flex-1 bg-transparent text-white placeholder:text-white/60 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:space-y-6">
        <div className="hidden md:block">
          <HighlightsGrid stats={highlights} />
        </div>
        <div className="hidden lg:block">
          <DeckPreview playlists={playlistPreview.slice(0, 4)} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="chrome-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Latest captures</h3>
            <a href="/cards" className="text-sm text-white/70 hover:text-white">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {latestCards.map((card) => (
              <a
                key={card.id}
                href={`/cards/${card.id}`}
                className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-accent"
              >
                <div className="flex-1 min-w-0">
                  <div className="max-h-16 overflow-hidden text-sm font-semibold text-white">
                    <MarkdownView content={card.front} />
                  </div>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                    {card.tags?.join(', ') || 'general'}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs text-white/60">
                  {new Date(card.createdAt).toLocaleDateString()}
                </span>
              </a>
            ))}
            {latestCards.length === 0 && <p className="text-sm text-white/60">No cards captured yet.</p>}
          </div>
        </div>

        <div className="chrome-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent sessions</h3>
            <a href="/study" className="text-sm text-white/70 hover:text-white">
              Start review
            </a>
          </div>
          <div className="space-y-3">
            {latestLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="max-h-16 overflow-hidden text-sm text-white/80">
                  {log.card?.front ? <MarkdownView content={log.card.front} /> : 'Card'}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-white/50">
                  <span>Rating: {log.rating}</span>
                  <span>{new Date(log.reviewedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            {latestLogs.length === 0 && <p className="text-sm text-white/60">No reviews yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
