import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/login');

  const userId = session.user.id;
  const now = new Date();

  const [dueCount, totalCards, recentReviews] = await Promise.all([
    prisma.card.count({ where: { userId, OR: [{ due: { lte: now } }, { due: null }] } }),
    prisma.card.count({ where: { userId } }),
    prisma.reviewLog.count({ where: { userId, reviewedAt: { gte: new Date(now.getTime() - 1000 * 60 * 60 * 24) } } })
  ]);

  const metrics = [
    { label: 'Due now', value: dueCount },
    { label: 'Total cards', value: totalCards },
    { label: 'Reviews (24h)', value: recentReviews }
  ];

  return (
    <div className="space-y-8">
      <div className="glass-card flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Your notebook</p>
          <h1 className="mt-3 text-4xl font-semibold">
            Stay in sync with{' '}
            <span className="text-transparent bg-gradient-to-r from-accent to-white bg-clip-text">memory</span>
          </h1>
          <p className="mt-2 text-white/70">
            FSRS keeps your queue balanced. Review when cards peak for maximum retention.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-midnight-800/70 p-4 text-sm text-white/70">
          <p>Next due</p>
          <p className="text-3xl font-semibold text-white">{dueCount > 0 ? 'Ready now' : 'All clear'}</p>
          <p className="text-xs text-white/50">Updated in real time</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="glass-card">
            <p className="text-sm text-white/60">{metric.label}</p>
            <p className="mt-3 text-4xl font-semibold text-white">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card">
        <h2 className="text-xl font-semibold text-white">Quick actions</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/cards/new" className="btn-primary">
            Add card
          </a>
          <a href="/study" className="btn-secondary">
            Start study
          </a>
          <a href="/cards" className="btn-secondary">
            View cards
          </a>
        </div>
      </div>
    </div>
  );
}
