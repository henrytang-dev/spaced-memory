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

  const loadNext = async () => {
    setLoading(true);
    const res = await fetch('/api/study/next');
    const data = await res.json();
    const nextCard = data.cards?.[0] ?? null;
    setCard(nextCard);
    setShowAnswer(false);
    setLoading(false);
  };

  useEffect(() => {
    loadNext();
  }, []);

  const rate = async (rating: 'Again' | 'Hard' | 'Good' | 'Easy') => {
    if (!card) return;
    setMessage('Saving review...');
    const res = await fetch('/api/study/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: card.id, rating })
    });
    if (!res.ok) {
      setMessage('Failed to save review');
      return;
    }
    setMessage(null);
    await loadNext();
  };

  if (loading) {
    return <div className="glass-card text-white/70">Loading...</div>;
  }

  if (!card) {
    return (
      <div className="glass-card text-center">
        <p className="text-lg font-semibold text-white">All caught up!</p>
        <p className="text-white/70">No due cards. Add more or check back later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card space-y-4">
        <div className="text-xs uppercase tracking-[0.3em] text-white/60">Question</div>
        <MarkdownView content={card.front} />
        <button className="btn-secondary mt-3" onClick={() => setShowAnswer(true)}>
          Show answer
        </button>
        {showAnswer && (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">Answer</div>
            <MarkdownView content={card.back} />
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
