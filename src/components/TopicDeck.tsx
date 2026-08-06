"use client";

import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { SwipeCard, type CardTopic } from "./SwipeCard";

type DeckProps = {
  topics: CardTopic[];
  revealMode?: boolean;
  leftLabel?: string;
  rightLabel?: string;
  leftStatus: "skipped" | "failed";
  rightStatus: "studied" | "correct";
  onComplete: (stats: { right: number; left: number }) => void;
};

export function TopicDeck({
  topics,
  revealMode = false,
  leftLabel,
  rightLabel,
  leftStatus,
  rightStatus,
  onComplete,
}: DeckProps) {
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState({ right: 0, left: 0 });
  const [busy, setBusy] = useState(false);

  const remaining = topics.length - index;
  const current = topics[index];

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      if (!current || busy) return;
      setBusy(true);

      const status = direction === "right" ? rightStatus : leftStatus;
      const nextStats = {
        right: stats.right + (direction === "right" ? 1 : 0),
        left: stats.left + (direction === "left" ? 1 : 0),
      };

      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId: current.id, status }),
        });
      } catch {
        // still advance so the session isn't stuck offline
      }

      setStats(nextStats);

      if (index + 1 >= topics.length) {
        onComplete(nextStats);
      } else {
        setIndex((i) => i + 1);
      }
      setBusy(false);
    },
    [busy, current, index, leftStatus, onComplete, rightStatus, stats, topics.length]
  );

  if (!current) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between px-1 text-sm text-[var(--muted)]">
        <span>
          {index + 1} / {topics.length}
        </span>
        <span>{remaining} left</span>
      </div>
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <SwipeCard
            key={current.id}
            topic={current}
            revealMode={revealMode}
            onSwipe={handleSwipe}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
          />
        </AnimatePresence>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => handleSwipe("left")}
          className="rounded-xl border border-[var(--skipped)]/40 bg-[var(--skipped-soft)] py-3 text-sm font-medium text-[var(--skipped)] active:scale-[0.98]"
        >
          {leftLabel ?? "Skip"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => handleSwipe("right")}
          className="rounded-xl border border-[var(--studied)]/40 bg-[var(--studied-soft)] py-3 text-sm font-medium text-[var(--studied)] active:scale-[0.98]"
        >
          {rightLabel ?? "Studied"}
        </button>
      </div>
    </div>
  );
}
