'use client';

import Link from 'next/link';
import { useState } from 'react';

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
      <div className="glass-card flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Memory vault</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">All cards</h1>
          <p className="text-sm text-white/60">Search semantically or filter manually. Everything stays synced.</p>
        </div>
        <Link href="/cards/new" className="btn-primary self-start">
          New card
        </Link>
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
            className="glass-card block transition hover:-translate-y-1 hover:border-accent"
          >
            <div className="flex flex-wrap items-center justify-between text-xs text-white/60">
              <div className="uppercase tracking-wide">{card.tags?.join(', ') || 'General'}</div>
              <div>{card.due ? `Due ${new Date(card.due).toLocaleDateString()}` : 'New'}</div>
            </div>
            <div className="mt-3 text-lg font-semibold text-white">
              {card.front.length > 180 ? `${card.front.slice(0, 180)}…` : card.front}
            </div>
            <p className="mt-2 text-sm text-white/70">
              {card.back.length > 180 ? `${card.back.slice(0, 180)}…` : card.back}
            </p>
          </Link>
        ))}
      </div>
      {cards.length === 0 && (
        <div className="glass-card text-center text-white/60">No cards yet. Create one to get started.</div>
      )}
    </div>
  );
}
