"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownView from "./MarkdownView";

type StudyCard = {
  id: string;
  front: string;
  due: string | null;
};

export default function PlaybackBar() {
  const [nextCard, setNextCard] = useState<StudyCard | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadNext = async () => {
      try {
        const res = await fetch("/api/study/next");
        const data = await res.json();
        const card = data.cards?.[0];
        if (card) {
          setNextCard({
            id: card.id,
            front: card.front,
            due: card.due || null,
          });
        }
      } catch (err) {
        console.error("Failed to load next card", err);
      }
    };
    loadNext();
  }, []);

  const handlePlay = () => {
    router.push("/study");
  };

  return (
    <div className="glass-pill mx-auto mt-3 flex w-full flex-col items-start gap-2 px-4 py-3 text-white sm:w-4/5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10" title="Previous">
          ⏮
        </button>
        <button
          onClick={handlePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900"
          title="Start study"
        >
          ▶
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10" title="Next">
          ⏭
        </button>
      </div>
      <div className="flex flex-1 items-center gap-2 sm:gap-3">
        <div className="hidden h-10 w-10 rounded-xl bg-white/15 sm:block" />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.25em] text-white/60">
            {nextCard ? "Next Due Card" : "Queue is loading"}
          </p>
          <div className="max-h-12 overflow-hidden text-xs text-white/80">
            {nextCard ? <MarkdownView content={nextCard.front} /> : <p>Fetching next card…</p>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-white/80">
        <span className="text-base">⌗</span>
        <span className="text-base">↻</span>
        <span className="text-base">✎</span>
      </div>
    </div>
  );
}
