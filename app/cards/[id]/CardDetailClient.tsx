'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownView from '@/components/MarkdownView';
import Link from 'next/link';
import { CardDTO } from '../CardsClient';

type PlaylistSummary = {
  id: string;
  name: string;
  cardCount: number;
  hasCard: boolean;
};

export default function CardDetailClient({ card, playlists }: { card: CardDTO; playlists: PlaylistSummary[] }) {
  const router = useRouter();
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [tags, setTags] = useState(card.tags.join(', '));
  const [status, setStatus] = useState<string | null>(null);
  const [playlistStatus, setPlaylistStatus] = useState<string | null>(null);
  const [playlistState, setPlaylistState] = useState(playlists);
  const [showAnswer, setShowAnswer] = useState(false);

  const save = async () => {
    setStatus('Saving...');
    const res = await fetch(`/api/cards/${card.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front, back, tags: tags.split(',').map((t) => t.trim()).filter(Boolean) })
    });
    if (res.ok) {
      setStatus('Saved');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({ error: 'Failed to save' }));
      setStatus(data.error || 'Failed to save');
    }
  };

  const togglePlaylist = async (playlistId: string, hasCard: boolean) => {
    const snapshot = playlistState;
    setPlaylistStatus('Updating playlists...');
    setPlaylistState((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const delta = hasCard ? (pl.hasCard ? 0 : 1) : pl.hasCard ? -1 : 0;
        return { ...pl, hasCard, cardCount: pl.cardCount + delta };
      })
    );
    const res = await fetch(`/api/playlists/${playlistId}/cards`, {
      method: hasCard ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: card.id })
    });
    if (!res.ok) {
      setPlaylistStatus('Failed to update playlist');
      setPlaylistState(snapshot);
      return;
    }
    setPlaylistStatus('Playlist updated');
    router.refresh();
  };

  const remove = async () => {
    setStatus('Deleting...');
    const res = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.refresh();
      router.push('/cards');
    } else {
      setStatus('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Card control</p>
          <h1 className="text-3xl font-semibold text-white">Details & editor</h1>
        </div>
        <button onClick={remove} className="btn-secondary border-red-500/50 text-red-300 hover:border-red-400">
          Delete
        </button>
      </div>

      <div className="glass-card space-y-4">
        <div className="text-xs uppercase tracking-[0.3em] text-white/60">Question</div>
        <MarkdownView content={front} />
        <button className="btn-secondary mt-2" onClick={() => setShowAnswer((s) => !s)}>
          {showAnswer ? 'Hide answer' : 'Reveal answer'}
        </button>
        {showAnswer && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">Answer</div>
            <MarkdownView content={back} />
          </div>
        )}
      </div>

      <div className="glass-card">
        <h2 className="text-lg font-semibold text-white">Edit content</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/70">Question (front)</label>
            <textarea className="textarea-field" rows={4} value={front} onChange={(e) => setFront(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Answer (back)</label>
            <textarea className="textarea-field" rows={5} value={back} onChange={(e) => setBack(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Tags</label>
            <input className="input-field" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          {status && <p className="text-sm text-white/70">{status}</p>}
          <div className="flex gap-3">
            <button onClick={save} className="btn-primary">
              Save changes
            </button>
            <button onClick={() => router.push('/cards')} className="btn-secondary">
              Back to list
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Decks & playlists</h2>
          <Link href="/playlists" className="text-sm text-white/70 hover:text-white">
            Manage
          </Link>
        </div>
        {playlistState.length === 0 ? (
          <p className="text-sm text-white/70">No playlists yet. Create one to group related questions.</p>
        ) : (
          <div className="space-y-2">
            {playlistState.map((pl) => (
              <label
                key={pl.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
              >
                <span>
                  <span className="font-semibold text-white">{pl.name}</span>
                  <span className="ml-2 text-xs text-white/60">{pl.cardCount} cards</span>
                </span>
                <input
                  type="checkbox"
                  checked={pl.hasCard}
                  onChange={(e) => togglePlaylist(pl.id, e.target.checked)}
                />
              </label>
            ))}
          </div>
        )}
        {playlistStatus && <p className="text-xs text-white/60">{playlistStatus}</p>}
      </div>
    </div>
  );
}
