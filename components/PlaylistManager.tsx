'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Playlist = {
  id: string;
  name: string;
  description: string | null;
  cardCount: number;
  createdAt: string;
};

export default function PlaylistManager({ initialPlaylists }: { initialPlaylists: Playlist[] }) {
  const [playlists, setPlaylists] = useState(initialPlaylists);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  const createPlaylist = async () => {
    if (!name.trim()) {
      setStatus('Name is required');
      return;
    }
    setStatus('Creating...');
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to create playlist' }));
      setStatus(data.error);
      return;
    }
    const playlist = await res.json();
    setPlaylists((prev) => [{ ...playlist, cardCount: 0, createdAt: playlist.createdAt }, ...prev]);
    setName('');
    setDescription('');
    setStatus('Playlist created');
    router.refresh();
  };

  const deletePlaylist = async (id: string) => {
    setStatus('Deleting...');
    const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setStatus('Failed to delete playlist');
      return;
    }
    setPlaylists((prev) => prev.filter((pl) => pl.id !== id));
    setStatus('Playlist deleted');
    router.refresh();
  };

  return (
    <div className="glass-card space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">New playlist</p>
          <div className="mt-3 space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="input-field"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="textarea-field"
              rows={3}
            />
            <button onClick={createPlaylist} className="btn-primary w-full justify-center">
              Create
            </button>
            {status && <p className="text-xs text-white/70">{status}</p>}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-3 max-h-80 overflow-y-auto">
          {playlists.length === 0 ? (
            <p className="text-sm text-white/70">No playlists yet.</p>
          ) : (
            playlists.map((pl) => (
              <div
                key={pl.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div>
                  <Link href={`/playlists/${pl.id}`} className="font-semibold text-white hover:underline">
                    {pl.name}
                  </Link>
                  <p className="text-xs text-white/60">{pl.cardCount} cards</p>
                </div>
                <button onClick={() => deletePlaylist(pl.id)} className="text-sm text-red-300">
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
