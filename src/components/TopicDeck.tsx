"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useUserProfile } from "@/components/UserProfileProvider";
import {
  SwipeCard,
  type CardTopic,
  type SwipeCardHandle,
} from "./SwipeCard";
import { PrepBridge } from "./PrepBridge";

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
  /**
   * When jumping into a list mid-way, show (positionOffset + index + 1) / totalCount
   * instead of session-relative 1/N.
   */
  positionOffset?: number;
  onComplete: (stats: { right: number; left: number }) => void;
  /** Fires when the visible card changes (including initial mount). */
  onActiveTopicChange?: (topic: CardTopic | null) => void;
};

const BRIDGE_MS = 420;

export function TopicDeck({
  topics,
  revealMode = false,
  leftLabel,
  rightLabel,
  leftStatus,
  rightStatus,
  completedCount,
  totalCount,
  positionOffset,
  onComplete,
  onActiveTopicChange,
}: DeckProps) {
  const { profile } = useUserProfile();
  const keyboardEnabled = profile?.keyboardShortcutsEnabled ?? false;
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState({ right: 0, left: 0 });
  const [busy, setBusy] = useState(false);
  const [bridging, setBridging] = useState(false);
  const [bridgeSeed, setBridgeSeed] = useState(0);
  const [completed, setCompleted] = useState(completedCount ?? 0);
  const cardRef = useRef<SwipeCardHandle>(null);
  const busyRef = useRef(false);
  const bridgingRef = useRef(false);

  const useCategoryProgress =
    typeof completedCount === "number" &&
    typeof totalCount === "number" &&
    positionOffset === undefined;
  const useAbsolutePosition =
    typeof positionOffset === "number" && typeof totalCount === "number";
  const remaining = topics.length - index;
  const current = topics[index];

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    bridgingRef.current = bridging;
  }, [bridging]);

  useEffect(() => {
    onActiveTopicChange?.(current ?? null);
  }, [current, onActiveTopicChange]);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (!current || busy) return;
      setBusy(true);

      const status = direction === "right" ? rightStatus : leftStatus;
      const nextStats = {
        right: stats.right + (direction === "right" ? 1 : 0),
        left: stats.left + (direction === "left" ? 1 : 0),
      };
      const topicId = current.id;
      const isLast = index + 1 >= topics.length;

      // Persist in background — don't block the next card
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, status }),
      }).catch(() => {});

      setStats(nextStats);
      if (direction === "right" && useCategoryProgress) {
        setCompleted((c) => c + 1);
      }

      if (isLast) {
        onComplete(nextStats);
        setBusy(false);
        return;
      }

      setBridgeSeed((s) => s + 1);
      setBridging(true);

      window.setTimeout(() => {
        setIndex((i) => i + 1);
        setBridging(false);
        setBusy(false);
      }, BRIDGE_MS);
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

  function triggerSwipe(direction: "left" | "right") {
    if (busy || bridging) return;
    cardRef.current?.swipe(direction);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (busyRef.current || bridgingRef.current) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (revealMode && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        cardRef.current?.reveal();
        return;
      }

      if (!keyboardEnabled) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        cardRef.current?.swipe("left");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        cardRef.current?.swipe("right");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [revealMode, keyboardEnabled]);

  if (!current && !bridging) {
    return (
      <div className="panel p-5 text-sm text-[var(--muted)]">
        No topic to show.
      </div>
    );
  }

  const counterLeft = useAbsolutePosition
    ? `${positionOffset + index + 1} / ${totalCount}`
    : useCategoryProgress
      ? `${completed} / ${totalCount}`
      : `${index + 1} / ${topics.length}`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2 px-1 text-sm text-[var(--muted)]">
        <span>{counterLeft}</span>
        {keyboardEnabled ? (
          <span className="deck-key-hint deck-hint-desktop" aria-hidden>
            ← {leftLabel ?? "Skip"} · → {rightLabel ?? "Studied"}
          </span>
        ) : null}
        <span>{Math.max(remaining - (bridging ? 1 : 0), 0)} left</span>
      </div>

      <div className="relative min-h-0 w-full flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {bridging ? (
            <PrepBridge key={`bridge-${bridgeSeed}`} seed={bridgeSeed} />
          ) : current ? (
            <SwipeCard
              key={current.id}
              ref={cardRef}
              topic={current}
              revealMode={revealMode}
              onSwipe={handleSwipe}
              leftLabel={leftLabel}
              rightLabel={rightLabel}
            />
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-4 grid shrink-0 grid-cols-2 gap-3">
        <button
          type="button"
          disabled={busy || bridging}
          onClick={() => triggerSwipe("left")}
          className="rounded-xl border border-[var(--skipped)]/40 bg-[var(--skipped-soft)] py-3 text-sm font-medium text-[var(--skipped)] active:scale-[0.98] disabled:opacity-50"
        >
          {leftLabel ?? "Skip"}
        </button>
        <button
          type="button"
          disabled={busy || bridging}
          onClick={() => triggerSwipe("right")}
          className="rounded-xl border border-[var(--studied)]/40 bg-[var(--studied-soft)] py-3 text-sm font-medium text-[var(--studied)] active:scale-[0.98] disabled:opacity-50"
        >
          {rightLabel ?? "Studied"}
        </button>
      </div>
    </div>
  );
}
