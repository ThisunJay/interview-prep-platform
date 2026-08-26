"use client";

import { useRouter } from "next/navigation";
import { useRef, type MouseEvent } from "react";
import { animate, motion, useMotionValue, type PanInfo } from "framer-motion";
import type { CategoryRow } from "@/lib/category-types";

const ACTION_WIDTH = 76;
const PIN_THRESHOLD = 56;

type SwipeCategoryRowProps = {
  category: CategoryRow;
  onTogglePin: (categoryId: number, pinned: boolean) => void;
};

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 17v5" />
      <path d="M9 3h6l1 7h-8l1-7z" />
      <path d="M9 10v4h6v-4" />
    </svg>
  );
}

export function SwipeCategoryRow({ category, onTogglePin }: SwipeCategoryRowProps) {
  const router = useRouter();
  const x = useMotionValue(0);
  const dragDistance = useRef(0);
  const toggledThisGesture = useRef(false);

  const pct =
    category.topic_count > 0
      ? Math.round((category.studied_count / category.topic_count) * 100)
      : 0;

  function snapBack() {
    animate(x, 0, { type: "spring", stiffness: 520, damping: 38 });
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x >= PIN_THRESHOLD && !toggledThisGesture.current) {
      toggledThisGesture.current = true;
      onTogglePin(category.id, !category.pinned);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(12);
      }
    }
    snapBack();
    window.setTimeout(() => {
      dragDistance.current = 0;
      toggledThisGesture.current = false;
    }, 0);
  }

  function handleActionClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onTogglePin(category.id, !category.pinned);
    snapBack();
  }

  function handleRowClick() {
    if (dragDistance.current > 8) return;
    router.push(`/study/${category.id}`);
  }

  const actionLabel = category.pinned ? "Unpin" : "Pin";

  return (
    <li className="swipe-category-row">
      <div
        className={`swipe-category-action ${category.pinned ? "is-unpin" : "is-pin"}`}
        aria-hidden
      >
        <button
          type="button"
          className="swipe-category-action-btn"
          onClick={handleActionClick}
          aria-label={`${actionLabel} ${category.name}`}
        >
          <PinIcon filled={!category.pinned} />
          <span>{actionLabel}</span>
        </button>
      </div>

      <motion.div
        className={`category-link swipe-category-card ${category.pinned ? "is-pinned" : ""}`}
        style={{ x, width: "100%" }}
        drag="x"
        dragConstraints={{ left: 0, right: ACTION_WIDTH }}
        dragElastic={0.08}
        onDrag={(_, info) => {
          dragDistance.current = Math.max(dragDistance.current, Math.abs(info.offset.x));
        }}
        onDragEnd={handleDragEnd}
        onClick={handleRowClick}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleRowClick();
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {category.pinned ? (
                <span className="category-pin-badge" title="Pinned">
                  <PinIcon filled />
                </span>
              ) : null}
              <p className="truncate font-[family-name:var(--font-display)] text-lg font-medium">
                {category.name}
              </p>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {category.topic_count} topics · {pct}% studied
            </p>
          </div>
          <span className="mt-1 shrink-0 text-[var(--accent)]">→</span>
        </div>
        <div className="category-progress-track">
          <div
            className="category-progress-fill"
            style={{ width: pct > 0 ? `${pct}%` : "0%" }}
          />
        </div>
      </motion.div>
    </li>
  );
}
