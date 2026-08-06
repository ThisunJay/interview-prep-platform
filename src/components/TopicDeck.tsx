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
  /** Category progress: completed so far / total topics */
  completedCount?: number;
  totalCount?: number;
  onComplete: (stats: { right: number; left: number }) => void;
};

export function TopicDeck({
  topics,
  revealMode = false,
  leftLabel,
  rightLabel,
  leftStatus,
  rightStatus,
  completedCount,
  totalCount,
  onComplete,
}: DeckProps) {
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState({ right: 0, left: 0 });
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(completedCount ?? 0);

  const useCategoryProgress =
    typeof completedCount === "number" && typeof totalCount === "number";
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
      if (direction === "right" && useCategoryProgress) {
        setCompleted((c) => c + 1);
      }

      if (index + 1 >= topics.length) {
        onComplete(nextStats);
      } else {
        setIndex((i) => i + 1);
      }
      setBusy(false);
    },
    [
      busy,
      current,
      index,
      leftStatus,
      onComplete,
      rightStatus,
      stats,
      topics.length,
      useCategoryProgress,
    ]
  );

  if (!current) {
    return (
      <div className="panel p-5 text-sm text-[var(--muted)]">
        No topic to show.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-between px-1 text-sm text-[var(--muted)]">
        <span>
          {useCategoryProgress
            ? `${completed} / ${totalCount}`
            : `${index + 1} / ${topics.length}`}
        </span>
        <span>{remaining} left</span>
      </div>

      {/* Explicit height so absolute swipe cards are visible */}
      <div className="relative min-h-0 w-full flex-1">
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

      <div className="mt-4 grid shrink-0 grid-cols-2 gap-3">
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
