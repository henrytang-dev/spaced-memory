'use client';

import Link from 'next/link';
import { useState } from 'react';
import MarkdownView from '@/components/MarkdownView';

export type CardDTO = {
  id: string;
  playlist?: string;
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
      <div className="glass-card flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <span className="pill">Neural archive</span>
          <h1 className="text-2xl font-semibold text-white md:text-3xl">Curate your knowledge grid</h1>
          <p className="text-xs text-white/60">Mathpix captures and edits stay synced here.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/cards/new" className="btn-primary px-4 py-2 text-sm">
            New card
          </Link>
          <a href="/study" className="btn-secondary px-4 py-2 text-sm">
            Study
          </a>
        </div>
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
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] uppercase tracking-wide">
                  {card.playlist || 'Unfiled'}
                </span>
                <span className="uppercase tracking-wide">{card.tags?.join(', ') || 'General'}</span>
              </div>
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
