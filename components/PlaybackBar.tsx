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

  const snippet = (() => {
    const raw =
      nextCard?.front
        ?.replace(/[#*_`>~]/g, '')
        .replace(/\s+/g, ' ')
        .trim() ?? '';
    if (raw.length > 140) return `${raw.slice(0, 140)}…`;
    return raw;
  })();

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
    <div className="glass-pill fixed bottom-2 left-1/2 z-30 flex w-[90vw] max-w-4xl -translate-x-1/2 items-center gap-3 px-3 py-2 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:gap-4 sm:px-5">
      <div className="flex flex-1 items-center gap-3 sm:gap-4 overflow-hidden">
        <div className="hidden h-8 w-8 shrink-0 rounded-xl bg-white/15 sm:block" />
        <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/60 whitespace-nowrap">
            {nextCard ? "Next Due Card" : "Queue is loading"}
          </p>
          <p className="truncate text-[11px] text-white/80 sm:line-clamp-2 sm:whitespace-normal">
            {nextCard ? snippet || "Ready to review" : "Fetching next card…"}
          </p>
        </div>
        {nextCard?.due && (
          <div className="hidden shrink-0 rounded-full border border-white/20 px-3 py-1 text-[11px] text-white/70 sm:block">
            Due {new Date(nextCard.due).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
