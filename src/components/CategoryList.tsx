"use client";

import { useMemo, useState } from "react";
import {
  MAX_PINNED_CATEGORIES,
  sortCategories,
  type CategoryRow,
} from "@/lib/category-types";
import { SwipeCategoryRow } from "@/components/SwipeCategoryRow";

type CategoryListProps = {
  initialCategories: CategoryRow[];
};

export function CategoryList({ initialCategories }: CategoryListProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [error, setError] = useState<string | null>(null);

  const pinnedCount = useMemo(
    () => categories.filter((c) => c.pinned).length,
    [categories]
  );

  async function togglePin(categoryId: number, pinned: boolean) {
    setError(null);

    const previous = categories;
    setCategories((current) => {
      const next = current.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              pinned,
              pinned_at: pinned ? new Date().toISOString() : null,
            }
          : c
      );
      return sortCategories(next);
    });

    try {
      const res = await fetch("/api/categories/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, pinned }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not update pin");
      }
    } catch (err) {
      setCategories(previous);
      setError(err instanceof Error ? err.message : "Could not update pin");
    }
  }

  const pinned = categories.filter((c) => c.pinned);
  const unpinned = categories.filter((c) => !c.pinned);

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--muted)]">
        Swipe a category right to pin · up to {MAX_PINNED_CATEGORIES} pinned
      </p>

      {error ? (
        <p className="rounded-lg border border-[var(--skipped)]/40 bg-[var(--skipped-soft)] px-3 py-2 text-sm text-[var(--skipped)]">
          {error}
        </p>
      ) : null}

      {pinned.length > 0 ? (
        <div>
          <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
            Pinned
          </p>
          <ul className="space-y-3">
            {pinned.map((cat) => (
              <SwipeCategoryRow
                key={cat.id}
                category={cat}
                onTogglePin={togglePin}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {unpinned.length > 0 ? (
        <div>
          {pinned.length > 0 ? (
            <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
              All categories
            </p>
          ) : null}
          <ul className="space-y-3">
            {unpinned.map((cat) => (
              <SwipeCategoryRow
                key={cat.id}
                category={cat}
                onTogglePin={togglePin}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {pinnedCount > 0 ? (
        <p className="text-center text-xs text-[var(--muted)]">
          {pinnedCount}/{MAX_PINNED_CATEGORIES} pinned
        </p>
      ) : null}
    </div>
  );
}
