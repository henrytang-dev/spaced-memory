type Stat = {
  title: string;
  value: string;
  subtitle?: string;
};

export default function HighlightsGrid({ stats }: { stats: Stat[] }) {
  if (!stats.length) return null;
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.title} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">{stat.title}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
          {stat.subtitle && <p className="text-xs text-white/60">{stat.subtitle}</p>}
        </div>
      ))}
    </div>
  );
}
