"use client";

import { motion } from "framer-motion";

const PROMPTS = [
  "Next question…",
  "Drawing a topic…",
  "Shuffle the deck…",
  "Interview mode…",
];

export function PrepBridge({ seed = 0 }: { seed?: number }) {
  const label = PROMPTS[seed % PROMPTS.length];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-[rgba(12,26,38,0.9)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="relative mb-8 h-28 w-40">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 h-[4.5rem] w-[3.2rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--accent)]/50 bg-gradient-to-b from-[#1a3a4f] to-[#102636] shadow-lg"
            style={{ originX: 0.5, originY: 1 }}
            initial={{ rotate: (i - 1) * 8, y: 8, opacity: 0.35 }}
            animate={{
              rotate: [(i - 1) * 12, (i - 1) * -14, (i - 1) * 10, (i - 1) * 6],
              y: [10, -6, 4, 0],
              opacity: [0.4, 1, 0.85, 0.95],
              scale: [0.92, 1.04, 0.98, 1],
            }}
            transition={{
              duration: 0.85,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.08,
            }}
          >
            <div className="absolute inset-x-2 top-2 h-1 rounded-full bg-[var(--accent)]/35" />
            <div className="absolute inset-x-2 top-4 h-1 rounded-full bg-[var(--accent)]/20" />
            <div className="absolute inset-x-3 bottom-3 flex h-6 items-center justify-center rounded-md border border-dashed border-[var(--accent)]/40">
              <span className="font-[family-name:var(--font-display)] text-lg text-[var(--accent)]">
                ?
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        className="font-[family-name:var(--font-display)] text-base tracking-wide text-[var(--ink-soft)]"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0.45, 1, 0.55], y: [4, 0, 2] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      >
        {label}
      </motion.p>

      <div className="mt-4 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
