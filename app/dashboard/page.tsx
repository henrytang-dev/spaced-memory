import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/authSession';
import { getSingleUserId } from '@/lib/singleUser';

export default async function DashboardPage() {
  if (!isAuthenticated()) redirect('/auth/login');
  const userId = await getSingleUserId();
  const now = new Date();

  const [dueCount, totalCards, recentReviews, latestCards, latestLogs] = await Promise.all([
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
    })
  ]);

  const metrics = [
    { label: 'Due now', value: dueCount },
    { label: 'Total cards', value: totalCards },
    { label: 'Reviews (24h)', value: recentReviews }
  ];

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card overflow-hidden">
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
            <div className="flex flex-wrap gap-3">
              <a href="/study" className="btn-primary">
                Launch session
              </a>
              <a href="/cards/new" className="btn-secondary">
                Capture knowledge
              </a>
            </div>
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

      <div className="grid gap-5 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="stat-card">
            <div className="relative z-10">
              <p className="text-sm text-white/60">{metric.label}</p>
              <p className="mt-3 text-4xl font-semibold text-white">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card space-y-4">
        <h2 className="text-xl font-semibold text-white">Quick actions</h2>
        <p className="text-sm text-white/60">Navigate between ingestion, review, and exploration.</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <a href="/cards/new" className="btn-primary">
            Add card
          </a>
          <a href="/study" className="btn-secondary">
            Start study
          </a>
          <a href="/cards" className="btn-secondary">
            View archive
          </a>
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
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-accent"
              >
                <div>
                  <p className="text-sm font-semibold text-white line-clamp-1">{card.front}</p>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                    {card.tags?.join(', ') || 'general'}
                  </p>
                </div>
                <span className="text-xs text-white/60">{new Date(card.createdAt).toLocaleDateString()}</span>
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
                <p className="text-sm text-white/70">{log.card?.front?.slice(0, 80) || 'Card'}</p>
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
