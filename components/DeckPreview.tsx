import Link from 'next/link';

type PlaylistPreviewProps = {
  playlists: { id: string; name: string; description: string | null; cardCount: number }[];
};

export default function DeckPreview({ playlists }: PlaylistPreviewProps) {
  if (playlists.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-white/20 px-6 py-8 text-center text-white/70">
        No decks yet. Create a playlist to group related cards.
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {playlists.map((playlist) => (
        <Link
          key={playlist.id}
          href={`/playlists/${playlist.id}`}
          className="space-y-2 rounded-3xl bg-white/5 p-4 transition hover:-translate-y-1 hover:bg-white/10"
        >
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-100/30 via-white/20 to-white/5" />
          <div>
            <p className="text-sm font-semibold text-white">{playlist.name}</p>
            <p className="text-xs text-white/70">{playlist.cardCount} cards</p>
            {playlist.description && <p className="text-xs text-white/60 line-clamp-2">{playlist.description}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}
