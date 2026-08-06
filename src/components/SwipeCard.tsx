"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type CardTopic = {
  id: number;
  title: string;
  description: string;
  section?: string | null;
};

type SwipeCardProps = {
  topic: CardTopic;
  /** When true, description starts hidden and double-tap reveals it */
  revealMode?: boolean;
  onSwipe: (direction: "left" | "right") => void;
  leftLabel?: string;
  rightLabel?: string;
};

const SWIPE_THRESHOLD = 110;

export function SwipeCard({
  topic,
  revealMode = false,
  onSwipe,
  leftLabel = "Skip",
  rightLabel = "Studied",
}: SwipeCardProps) {
  const [revealed, setRevealed] = useState(!revealMode);
  const lastTap = useRef(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-12, 0, 12]);
  const rightOpacity = useTransform(x, [40, 140], [0, 1]);
  const leftOpacity = useTransform(x, [-140, -40], [1, 0]);

  function handleTap() {
    if (!revealMode || revealed) return;
    const now = Date.now();
    if (now - lastTap.current < 320) {
      setRevealed(true);
    }
    lastTap.current = now;
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe("right");
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe("left");
    }
  }

  return (
    <motion.article
      className="swipe-card absolute inset-0 flex flex-col overflow-hidden touch-none select-none"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      initial={{ scale: 0.98, opacity: 0.4 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
    >
      <motion.div
        className="pointer-events-none absolute left-5 top-5 z-10 rounded-md border-2 border-[var(--studied)] px-3 py-1 text-sm font-semibold uppercase tracking-wide text-[var(--studied)]"
        style={{ opacity: rightOpacity }}
      >
        {rightLabel}
      </motion.div>
      <motion.div
        className="pointer-events-none absolute right-5 top-5 z-10 rounded-md border-2 border-[var(--skipped)] px-3 py-1 text-sm font-semibold uppercase tracking-wide text-[var(--skipped)]"
        style={{ opacity: leftOpacity }}
      >
        {leftLabel}
      </motion.div>

      <header className="shrink-0 border-b border-[var(--line)] px-5 pb-4 pt-6">
        {topic.section && (
          <p className="mb-1 font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            {topic.section}
          </p>
        )}
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug text-[var(--ink)]">
          {topic.title}
        </h2>
        {revealMode && !revealed && (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Double-tap to reveal the answer
          </p>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        {revealed ? (
          <div className="prose-prep text-[15px] leading-relaxed text-[var(--ink-soft)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {topic.description}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex h-full min-h-[180px] items-center justify-center">
            <div className="reveal-pulse rounded-full border border-dashed border-[var(--line)] px-6 py-10 text-center text-sm text-[var(--muted)]">
              Hidden — double-tap
            </div>
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-[var(--line)] px-5 py-3 text-center text-xs text-[var(--muted)]">
        Swipe right · {rightLabel} &nbsp;·&nbsp; Swipe left · {leftLabel}
      </footer>
    </motion.article>
  );
}
