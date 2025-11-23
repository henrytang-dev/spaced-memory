'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownView from '@/components/MarkdownView';
import { CardDTO } from '../CardsClient';

export default function CardDetailClient({ card }: { card: CardDTO }) {
  const router = useRouter();
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [tags, setTags] = useState(card.tags.join(', '));
  const [status, setStatus] = useState<string | null>(null);
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
    } else {
      const data = await res.json().catch(() => ({ error: 'Failed to save' }));
      setStatus(data.error || 'Failed to save');
    }
  };

  const remove = async () => {
    setStatus('Deleting...');
    const res = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' });
    if (res.ok) {
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
    </div>
  );
}
