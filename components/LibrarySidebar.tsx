import Link from 'next/link';
import LogoutButton from './LogoutButton';

type Stats = {
  totalCards: number;
  dueToday: number;
  newThisWeek: number;
  tags: number;
  playlists: number;
};

type PlaylistSummary = {
  id: string;
  name: string;
  description: string | null;
  cardCount: number;
};

export default function LibrarySidebar({
  authenticated,
  stats,
  playlists
}: {
  authenticated: boolean;
  stats?: Stats;
  playlists?: PlaylistSummary[];
}) {
  const overviewItems = [
    { label: 'Total Cards', value: stats?.totalCards ?? 0 },
    { label: 'Due Today', value: stats?.dueToday ?? 0 },
    { label: 'New This Week', value: stats?.newThisWeek ?? 0 },
    { label: 'Tags', value: stats?.tags ?? 0 }
  ];

  return (
    <aside className="flex h-full w-72 flex-col border-r border-white/10 px-8 py-6 text-white/80">
      <div className="mb-6">
        <p className="text-2xl font-semibold text-white">Memory Library</p>
        <p className="text-sm text-white/60">All cards</p>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Overview</p>
        <div className="space-y-2">
          {overviewItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm hover:bg-white/10">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80">●</span>
                <span>{item.label}</span>
              </div>
              <span className="text-base font-semibold text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
          <span>Decks</span>
          <span>⌵</span>
        </div>
        <div className="space-y-2">
          {playlists && playlists.length > 0 ? (
            playlists.map((pl, idx) => (
              <Link
                key={pl.id}
                href={`/playlists/${pl.id}`}
                className={`flex items-center justify-between rounded-2xl px-4 py-2 text-sm ${
                  idx === 0 ? 'bg-white/25 text-slate-800' : 'hover:bg-white/10'
                }`}
              >
                <span>{pl.name}</span>
                <span className="text-xs text-slate-600">{pl.cardCount} cards</span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-white/60">No playlists yet.</p>
          )}
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-6">
        {authenticated && <LogoutButton />}
      </div>
    </aside>
  );
}
