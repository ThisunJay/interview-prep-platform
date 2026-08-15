"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  animate,
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

export type SwipeCardHandle = {
  swipe: (direction: "left" | "right") => void;
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
const FLY_DISTANCE = 480;

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(
  function SwipeCard(
    {
      topic,
      revealMode = false,
      onSwipe,
      leftLabel = "Skip",
      rightLabel = "Studied",
    },
    ref
  ) {
    const [revealed, setRevealed] = useState(!revealMode);
    const [leaving, setLeaving] = useState(false);
    const lastTap = useRef(0);
    const leavingRef = useRef(false);
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14]);
    const rightOpacity = useTransform(x, [40, 140], [0, 1]);
    const leftOpacity = useTransform(x, [-140, -40], [1, 0]);
    const opacity = useTransform(
      x,
      [-FLY_DISTANCE, -120, 0, 120, FLY_DISTANCE],
      [0, 1, 1, 1, 0]
    );

    async function flyAway(direction: "left" | "right") {
      if (leavingRef.current) return;
      leavingRef.current = true;
      setLeaving(true);

      const target = direction === "right" ? FLY_DISTANCE : -FLY_DISTANCE;
      await animate(x, target, {
        type: "spring",
        stiffness: 280,
        damping: 28,
        velocity: direction === "right" ? 800 : -800,
      });

      onSwipe(direction);
    }

    useImperativeHandle(ref, () => ({
      swipe: (direction) => {
        void flyAway(direction);
      },
    }));

    function handleTap() {
      if (!revealMode || revealed || leavingRef.current) return;
      const now = Date.now();
      if (now - lastTap.current < 320) {
        setRevealed(true);
      }
      lastTap.current = now;
    }

    function handleDragEnd(_: unknown, info: PanInfo) {
      if (leavingRef.current) return;

      if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > 600) {
        void flyAway("right");
      } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -600) {
        void flyAway("left");
      } else {
        void animate(x, 0, { type: "spring", stiffness: 420, damping: 32 });
      }
    }

    return (
      <motion.article
        className="swipe-card absolute inset-0 flex flex-col overflow-hidden touch-none select-none"
        style={{ x, rotate, opacity }}
        drag={leaving ? false : "x"}
        dragListener={!leaving}
        dragConstraints={false}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ opacity: 0, transition: { duration: 0.08 } }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
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
);
