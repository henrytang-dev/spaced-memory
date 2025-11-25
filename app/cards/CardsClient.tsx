'use client';

import Link from 'next/link';
import { useState } from 'react';
import MarkdownView from '@/components/MarkdownView';

export type CardDTO = {
  id: string;
  front: string;
  back: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  due: string | null;
  lastReviewed: string | null;
};

export default function CardsClient({ initialCards }: { initialCards: CardDTO[] }) {
  const [cards, setCards] = useState<CardDTO[]>(initialCards);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) {
      setCards(initialCards);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.results) {
      setCards(
        data.results
          .map((r: any) => r.card)
          .filter(Boolean)
          .map((c: any) => ({
            ...c,
            createdAt: c.createdAt ?? new Date().toISOString(),
            updatedAt: c.updatedAt ?? new Date().toISOString(),
            due: c.due ?? null,
            lastReviewed: c.lastReviewed ?? null
          }))
      );
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <span className="pill">Neural archive</span>
          <h1 className="text-3xl font-semibold text-white md:text-4xl">
            Curate your{' '}
            <span className="text-transparent bg-gradient-to-r from-accent via-cyan-200 to-white bg-clip-text">
              knowledge grid
            </span>
          </h1>
          <p className="text-sm text-white/60">
            Mathpix captures, Markdown edits, and embeddings are kept in sync across this gallery.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/cards/new" className="btn-primary">
            New card
          </Link>
          <a href="/study" className="btn-secondary">
            Study
          </a>
        </div>
      </div>

      <div className="glass-card flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          placeholder="Semantic search across prompts + answers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-field flex-1"
        />
        <button onClick={handleSearch} className="btn-secondary" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.id}
            href={`/cards/${card.id}`}
            className="glass-card relative block overflow-hidden transition hover:-translate-y-1 hover:border-accent"
          >
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-accent blur-3xl" />
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs text-white/60">
              <div className="uppercase tracking-wide">{card.tags?.join(', ') || 'General'}</div>
              <div>{card.due ? `Due ${new Date(card.due).toLocaleDateString()}` : 'New'}</div>
            </div>
            <div className="mt-3 text-lg font-semibold text-white max-h-32 overflow-hidden">
              <MarkdownView content={card.front} />
            </div>
            <div className="mt-2 text-sm text-white/70 max-h-24 overflow-hidden">
              <MarkdownView content={card.back} />
            </div>
          </Link>
        ))}
      </div>
      {cards.length === 0 && (
        <div className="glass-card text-center text-white/60">No cards yet. Create one to get started.</div>
      )}
    </div>
  );
}
