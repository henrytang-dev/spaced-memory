'use client';

import { useEffect, useState } from 'react';
import MarkdownView from '@/components/MarkdownView';

interface StudyCard {
  id: string;
  front: string;
  back: string;
  due: string | null;
}

export default function StudyClient() {
  const [card, setCard] = useState<StudyCard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [noteStatus, setNoteStatus] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [history, setHistory] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [hydrated, setHydrated] = useState(false);
  const [playlistId, setPlaylistId] = useState<string | undefined>(undefined);
  const [playlistLabel, setPlaylistLabel] = useState<string | undefined>(undefined);
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([]);
  const [sessionLimit, setSessionLimit] = useState<number>(30);

  const loadNext = async () => {
    setLoading(true);
    const url = new URL('/api/study/next', window.location.origin);
    if (playlistId) url.searchParams.set('playlistId', playlistId);
    if (sessionLimit) url.searchParams.set('limit', String(sessionLimit));
    if (sessionLimit) url.searchParams.set('cap', String(sessionLimit));
    const res = await fetch(url.toString());
    const data = await res.json();
    const nextCard = data.cards?.[0] ?? null;
    if (nextCard) {
      setHistory((prev) => {
        const base = prev.slice(0, currentIndex + 1);
        const updated = [...base, nextCard];
        setCurrentIndex(updated.length - 1);
        return updated;
      });
      setCard(nextCard);
      setShowAnswer(false);
      setNotes('');
      setNoteFile(null);
    } else {
      setCard(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNext();
  }, []);

  const rate = async (rating: 'Again' | 'Hard' | 'Good' | 'Easy') => {
    if (!card) return;
    if (currentIndex !== history.length - 1) {
      setMessage('Navigate to the latest card to rate');
      return;
    }
    setMessage('Saving review...');
    const res = await fetch('/api/study/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: card.id, rating, playlistId })
    });
    if (!res.ok) {
      setMessage('Failed to save review');
      return;
    }
    setMessage(null);
    await loadNext();
  };

  const loadNotes = async (cardId: string) => {
    const res = await fetch(`/api/cards/${cardId}/notes`);
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.content) {
      setNotes(data[0].content);
    }
  };

  useEffect(() => {
    if (card?.id) {
      loadNotes(card.id);
    }
  }, [card?.id]);

  const addNote = async () => {
    if (!card) return;
    if (!notes.trim() && !noteFile) {
      setNoteStatus('Add text or an image');
      return;
    }
    setNoteStatus('Saving note...');
    const form = new FormData();
    if (notes.trim()) form.append('content', notes.trim());
    if (noteFile) form.append('file', noteFile);
    const res = await fetch(`/api/cards/${card.id}/notes`, {
      method: 'POST',
      body: form
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to save note' }));
      setNoteStatus(data.error || 'Failed to save note');
      return;
    }
    const saved = await res.json();
    setNotes(saved.content || '');
    setNoteFile(null);
    setNoteStatus('Saved');
  };

  const deleteNote = async () => {
    if (!card) return;
    setNoteStatus('Deleting note...');
    const res = await fetch(`/api/cards/${card.id}/notes`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to delete note' }));
      setNoteStatus(data.error || 'Failed to delete');
      return;
    }
    setNotes('');
    setNoteFile(null);
    setNoteStatus('Deleted');
    setEditing(false);
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      const idx = currentIndex - 1;
      const prevCard = history[idx];
      setCurrentIndex(idx);
      setCard(prevCard);
      setShowAnswer(false);
      setNotes('');
      setNoteFile(null);
      loadNotes(prevCard.id);
    }
  };

  const goNext = () => {
    if (currentIndex < history.length - 1) {
      const idx = currentIndex + 1;
      const next = history[idx];
      setCurrentIndex(idx);
      setCard(next);
      setShowAnswer(false);
      setNotes('');
      setNoteFile(null);
      loadNotes(next.id);
    } else {
      loadNext();
    }
  };

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < history.length - 1 || !loading;
  const postpone = async () => {
    if (!card) return;
    setMessage('Postponing...');
    const res = await fetch('/api/study/postpone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: card.id, days: 1 })
    });
    if (!res.ok) {
      setMessage('Failed to postpone');
      return;
    }
    setMessage(null);
    await loadNext();
  };

  // Hydrate history from localStorage on mount and read playlist params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('playlistId') || undefined;
    const plabel = params.get('playlistName') || undefined;
    setPlaylistId(pid || undefined);
    setPlaylistLabel(plabel || undefined);
    const storedLimit = window.localStorage.getItem('sessionLimit');
    if (storedLimit) {
      const num = Number(storedLimit);
      if (!Number.isNaN(num) && num > 0) setSessionLimit(num);
    }
    const raw = localStorage.getItem('studyHistory');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { history: StudyCard[]; currentIndex: number };
        if (Array.isArray(parsed.history) && parsed.history.length > 0) {
          setHistory(parsed.history);
          const idx = Math.min(parsed.currentIndex, parsed.history.length - 1);
          setCurrentIndex(idx);
          setCard(parsed.history[idx]);
          setShowAnswer(false);
          setNotes('');
          setNoteFile(null);
          loadNotes(parsed.history[idx].id);
        }
      } catch (err) {
        console.error('Failed to restore history', err);
      }
    }
    setHydrated(true);
  }, []);

  // Persist history to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      'studyHistory',
      JSON.stringify({
        history,
        currentIndex
      })
    );
  }, [history, currentIndex]);

  // Initial fetch if no history restored
  useEffect(() => {
    if (!hydrated) return;
    if (history.length === 0) {
      loadNext();
    }
  }, [hydrated]);

  // Fetch playlists for selector
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

  // Reset history when playlist changes
  useEffect(() => {
    if (!hydrated) return;
    setHistory([]);
    setCurrentIndex(-1);
    setCard(null);
    setShowAnswer(false);
    setNotes('');
    setNoteFile(null);
    loadNext();
  }, [playlistId, hydrated, sessionLimit]);

  if (loading) {
    return <div className="glass-card text-white/70">Loading...</div>;
  }

  if (!card) {
    return (
      <div className="glass-card text-center">
        <p className="text-lg font-semibold text-white">Signal clear</p>
        <p className="text-white/70">No due cards detected. Capture a new challenge or return later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">Prompt</div>
            <div className="rounded-full border border-white/10 bg-white/5/60 px-3 py-1 text-[11px] text-white/70 shadow-inner shadow-white/10 backdrop-blur">
              <label className="mr-2 text-white/70">Playlist:</label>
              <select
                className="bg-transparent text-white/85 outline-none"
                value={playlistId ?? ''}
                onChange={(e) => {
                  const id = e.target.value || undefined;
                  const label = playlists.find((p) => p.id === id)?.name || undefined;
                  setPlaylistId(id);
                  setPlaylistLabel(label);
                  const url = new URL(window.location.href);
                  if (id) {
                    url.searchParams.set('playlistId', id);
                    if (label) url.searchParams.set('playlistName', label);
                  } else {
                    url.searchParams.delete('playlistId');
                    url.searchParams.delete('playlistName');
                  }
                  window.history.replaceState({}, '', url.toString());
                }}
              >
                <option value="">All</option>
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            {playlistLabel && (
              <span className="hidden sm:inline rounded-full border border-white/20 px-2 py-0.5 text-[11px] uppercase text-white/70">
                {playlistLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/70">
              <span>Session size:</span>
              <select
                className="bg-transparent text-white outline-none"
                value={sessionLimit}
                onChange={(e) => {
                  const v = Number(e.target.value) || 1;
                  setSessionLimit(v);
                  localStorage.setItem('sessionLimit', String(v));
                }}
              >
                {[10, 20, 30, 40, 60, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            {playlistLabel && (
              <span className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] uppercase text-white/70">
                {playlistLabel}
              </span>
            )}
            <button
              className="btn-secondary px-3 py-1 text-xs disabled:opacity-40"
              onClick={goPrev}
              disabled={!canPrev}
              title="Previous reviewed card"
            >
              ‹
            </button>
            <button
              className="btn-secondary px-3 py-1 text-xs disabled:opacity-40"
              onClick={goNext}
              disabled={!canNext}
              title="Next card"
            >
              ›
            </button>
            <button
              className="btn-secondary px-3 py-1 text-xs disabled:opacity-40"
              onClick={postpone}
              title="Postpone this card to tomorrow"
            >
              Postpone
            </button>
            <a href={`/cards/${card.id}`} className="btn-secondary px-3 py-1 text-xs">
              Edit card
            </a>
          </div>
        </div>
        <MarkdownView content={card.front} />
        <button className="btn-secondary mt-3" onClick={() => setShowAnswer(true)}>
          Show answer
        </button>
        {showAnswer && (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">Response</div>
            <MarkdownView content={card.back} />
          </div>
        )}
      </div>
      <div className="glass-card space-y-3">
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60"
            onClick={() => setNotesOpen((o) => !o)}
          >
            <span>{notesOpen ? '▼' : '►'}</span>
            <span>Notes</span>
          </button>
          <div className="flex items-center gap-2">
            {noteStatus && <span className="text-[11px] text-white/60">{noteStatus}</span>}
            {notesOpen && (
              <button className="btn-secondary px-3 py-1 text-xs" onClick={() => setEditing((e) => !e)}>
                {editing ? 'Cancel edit' : 'Edit note'}
              </button>
            )}
            {notesOpen && notes && (
              <button className="btn-secondary px-3 py-1 text-xs" onClick={deleteNote}>
                Delete note
              </button>
            )}
          </div>
        </div>
        {notesOpen && (
          <div className="space-y-3">
            {notes && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                <MarkdownView content={notes} />
              </div>
            )}
            {editing && (
              <>
                <textarea
                  className="textarea-field"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Type thoughts here; new image OCR will append below."
                />
                <div className="flex items-center justify-between gap-3 text-sm text-white/70">
                  <label className="cursor-pointer rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-center hover:border-accent">
                    {noteFile ? `Selected: ${noteFile.name}` : 'Upload note image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setNoteFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <button onClick={addNote} className="btn-primary px-4 py-2 text-sm">
                    Save note
                  </button>
                </div>
              </>
            )}
            {!notes && !editing && <p className="text-xs text-white/60">No notes yet. Tap edit to add one.</p>}
          </div>
        )}
      </div>
      {showAnswer && (
        <div className="glass-card flex flex-wrap gap-3">
          {(['Again', 'Hard', 'Good', 'Easy'] as const).map((label) => (
            <button key={label} onClick={() => rate(label)} className="btn-primary flex-1 min-w-[120px] text-center">
              {label}
            </button>
          ))}
        </div>
      )}
      {message && <p className="text-sm text-white/70">{message}</p>}
    </div>
  );
}
