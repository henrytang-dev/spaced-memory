'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownView from '@/components/MarkdownView';

type PlaylistCard = {
  id: string;
  front: string;
  tags: string[];
};

export default function PlaylistCardsClient({
  cards,
  playlistId,
  playlistName
}: {
  cards: PlaylistCard[];
  playlistId: string;
  playlistName: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([]);
  const [targetPlaylist, setTargetPlaylist] = useState<string>('');
  const [assignStatus, setAssignStatus] = useState<string | null>(null);
  const router = useRouter();

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await fetch('/api/playlists');
        const data = await res.json();
        if (Array.isArray(data.playlists)) {
          setPlaylists(data.playlists.map((p: any) => ({ id: p.id, name: p.name })));
        }
      } catch (err) {
        console.error('Failed to load playlists', err);
      }
    };
    fetchPlaylists();
  }, []);

  const assignToPlaylist = async () => {
    if (selected.size === 0) {
      setAssignStatus('Select at least one card');
      return;
    }
    setAssignStatus('Moving...');
    const body = {
      playlistId: targetPlaylist || 'unfiled',
      cardIds: Array.from(selected)
    };
    const res = await fetch('/api/playlists/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed' }));
      setAssignStatus(data.error || 'Failed to move');
      return;
    }
    setAssignStatus('Moved');
    setSelected(new Set());
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
        <span>Selected: {selected.size}</span>
        <select
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 outline-none"
          value={targetPlaylist}
          onChange={(e) => setTargetPlaylist(e.target.value)}
        >
          <option value="">Unfiled</option>
          {playlists.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button className="btn-secondary px-3 py-1 text-xs" onClick={assignToPlaylist}>
          Move to playlist
        </button>
        {assignStatus && <span className="text-[11px] text-white/60">{assignStatus}</span>}
      </div>

      <div className="glass-card space-y-3">
        {cards.length === 0 ? (
          <p className="text-sm text-white/70">No cards yet.</p>
        ) : (
          cards.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            >
              <div className="mb-1 flex items-center gap-2 text-[11px] uppercase text-white/60">
                <input
                  type="checkbox"
                  checked={selected.has(entry.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelect(entry.id);
                  }}
                  className="h-4 w-4 accent-accent"
                />
                <span className="rounded-full border border-white/20 px-2 py-0.5">{playlistName}</span>
                {entry.tags.length > 0 && <span className="hidden sm:inline">{entry.tags.join(', ')}</span>}
              </div>
              <div className="max-h-20 overflow-hidden text-sm font-semibold text-white">
                <MarkdownView content={entry.front} />
              </div>
              <div className="mt-1 flex items-center justify-end text-xs text-white/60">
                <a href={`/cards/${entry.id}`} className="hover:underline">
                  Open
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
