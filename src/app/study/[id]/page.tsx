"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TopicDeck } from "@/components/TopicDeck";
import type { CardTopic } from "@/components/SwipeCard";

type TopicRow = CardTopic & {
  status?: string | null;
  section?: string | null;
};

type Mode = "loading" | "deck" | "list" | "focus" | "done" | "empty";

function isStudiedStatus(status: string | null | undefined) {
  return status === "studied" || status === "correct";
}

function statusMeta(status: string | null | undefined) {
  switch (status) {
    case "studied":
    case "correct":
      return {
        label: "Studied",
        className: "text-[var(--studied)] bg-[var(--studied-soft)]",
      };
    case "skipped":
      return {
        label: "Skipped",
        className: "text-[var(--skipped)] bg-[var(--skipped-soft)]",
      };
    case "failed":
      return {
        label: "Missed",
        className: "text-[var(--skipped)] bg-[var(--skipped-soft)]",
      };
    default:
      return {
        label: "Not started",
        className: "text-[var(--muted)] bg-black/25",
      };
  }
}

export default function StudyPage() {
  const params = useParams<{ id: string }>();
  const [allTopics, setAllTopics] = useState<TopicRow[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [topicTotal, setTopicTotal] = useState(0);
  const [studiedCount, setStudiedCount] = useState(0);
  const [mode, setMode] = useState<Mode>("loading");
  const [stats, setStats] = useState({ right: 0, left: 0 });
  const [filter, setFilter] = useState<"all" | "unstudied">("unstudied");
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [deckKey, setDeckKey] = useState(0);
  const [activeTopicId, setActiveTopicId] = useState<number | null>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const mobileListScrollRef = useRef<HTMLDivElement>(null);

  const handleActiveTopicChange = useCallback((topic: CardTopic | null) => {
    setActiveTopicId(topic?.id ?? null);
  }, []);

  const scrollActiveTopicIntoView = useCallback(() => {
    if (activeTopicId == null) return;

    const scrollIn = (root: HTMLElement | null) => {
      if (!root) return;
      const el = root.querySelector(`[data-topic-id="${activeTopicId}"]`);
      if (el instanceof HTMLElement) {
        el.scrollIntoView({
          block: "center",
          behavior: "smooth",
          inline: "nearest",
        });
      }
    };

    scrollIn(listScrollRef.current);
    scrollIn(mobileListScrollRef.current);
  }, [activeTopicId]);

  const unstudiedTopics = useMemo(
    () => allTopics.filter((t) => !isStudiedStatus(t.status)),
    [allTopics]
  );

  const mobileTopics = filter === "all" ? allTopics : unstudiedTopics;

  const focusTopics =
    focusIndex !== null ? allTopics.slice(focusIndex) : [];

  const applyLoadedTopics = useCallback(
    (
      list: TopicRow[],
      cat: { name?: string; topic_count?: number; studied_count?: number } | null,
      nextFilter: "all" | "unstudied"
    ) => {
      setAllTopics(list);
      setCategoryName(cat?.name ?? "Category");
      setTopicTotal(Number(cat?.topic_count ?? list.length));
      setStudiedCount(Number(cat?.studied_count ?? 0));
      setDeckKey((k) => k + 1);
      setFocusIndex(null);
      setFilter(nextFilter);

      if (!list.length) {
        setMode("empty");
        return;
      }

      if (nextFilter === "all") {
        setMode("list");
        return;
      }

      const remaining = list.filter((t) => !isStudiedStatus(t.status));
      setMode(remaining.length ? "deck" : "empty");
    },
    []
  );

  const loadAllTopics = useCallback(
    async (nextFilter: "all" | "unstudied" = "unstudied") => {
      setMode("loading");

      const [topicsRes, catsRes] = await Promise.all([
        fetch(`/api/topics?categoryId=${params.id}&filter=all`),
        fetch("/api/categories"),
      ]);

      if (!topicsRes.ok) {
        setMode("empty");
        return;
      }

      const topicsData = await topicsRes.json();
      const catsData = catsRes.ok ? await catsRes.json() : { categories: [] };
      const cat = catsData.categories?.find(
        (c: { id: number }) => String(c.id) === String(params.id)
      );
      const list = (topicsData.topics ?? []) as TopicRow[];
      applyLoadedTopics(list, cat ?? null, nextFilter);
    },
    [applyLoadedTopics, params.id]
  );

  useEffect(() => {
    void loadAllTopics("unstudied");
  }, [loadAllTopics]);

  useEffect(() => {
    if (focusIndex !== null && allTopics[focusIndex]) {
      setActiveTopicId(allTopics[focusIndex].id);
    }
  }, [focusIndex, allTopics]);

  useEffect(() => {
    if (activeTopicId == null) return;

    // Wait for the All list to mount (mobile tab switch) before scrolling.
    const frame = window.requestAnimationFrame(() => {
      scrollActiveTopicIntoView();
    });
    const timeout = window.setTimeout(() => {
      scrollActiveTopicIntoView();
    }, 60);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [activeTopicId, mode, filter, scrollActiveTopicIntoView]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && focusIndex !== null) {
        event.preventDefault();
        setFocusIndex(null);
        setMode(filter === "all" ? "list" : unstudiedTopics.length ? "deck" : "empty");
        setDeckKey((k) => k + 1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filter, focusIndex, unstudiedTopics.length]);

  function syncModeAfterFilter(nextFilter: "all" | "unstudied") {
    setFilter(nextFilter);
    setFocusIndex(null);
    if (!allTopics.length) {
      setMode("empty");
      return;
    }
    if (nextFilter === "all") {
      setMode("list");
      return;
    }
    const remaining = allTopics.filter((t) => !isStudiedStatus(t.status));
    setMode(remaining.length ? "deck" : "empty");
    setDeckKey((k) => k + 1);
  }

  async function markStudyAgain(topicId: number) {
    const res = await fetch("/api/progress", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId }),
    });
    if (!res.ok) return;

    setAllTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, status: null } : t))
    );
    setStudiedCount((c) => Math.max(0, c - 1));
    setDeckKey((k) => k + 1);
    if (filter === "unstudied") {
      setMode("deck");
    }
  }

  function openTopicAt(index: number) {
    setFocusIndex(index);
    setMode("focus");
  }

  function clearFocus() {
    setFocusIndex(null);
    if (filter === "all") {
      setMode("list");
    } else if (unstudiedTopics.length) {
      setMode("deck");
      setDeckKey((k) => k + 1);
    } else {
      setMode("empty");
    }
  }

  function applyDeckProgress(s: { right: number; left: number }) {
    setStats(s);
    setStudiedCount((c) => c + s.right);
  }

  function renderTopicList(topics: TopicRow[], opts?: { compact?: boolean }) {
    return (
      <ul className="space-y-2">
        {topics.map((topic, index) => {
          const meta = statusMeta(topic.status);
          const studied = isStudiedStatus(topic.status);
          const absoluteIndex = allTopics.findIndex((t) => t.id === topic.id);
          const openIndex = absoluteIndex >= 0 ? absoluteIndex : index;
          const isActive = activeTopicId === topic.id;

          return (
            <li
              key={topic.id}
              data-topic-id={topic.id}
              className={`rounded-xl border px-3.5 py-3 transition ${
                isActive
                  ? "border-[var(--accent)]/55 bg-[rgba(20,40,56,0.9)]"
                  : "border-[var(--line)] bg-[rgba(10,22,34,0.55)] hover:border-[var(--accent)]/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left active:opacity-80"
                  onClick={() => openTopicAt(openIndex)}
                >
                  {topic.section && (
                    <p className="mb-0.5 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                      {topic.section}
                    </p>
                  )}
                  <p
                    className={`font-medium leading-snug text-[var(--ink)] ${
                      opts?.compact ? "text-sm" : ""
                    }`}
                  >
                    {topic.title}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--accent)]">
                    Open card →
                  </p>
                </button>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                  {studied && (
                    <button
                      type="button"
                      className="text-[11px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                      onClick={() => void markStudyAgain(topic.id)}
                    >
                      Study again
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  function renderDeckPanel() {
    if (mode === "loading") {
      return <p className="text-[var(--muted)]">Loading topics…</p>;
    }

    if (mode === "focus" && focusTopics.length > 0 && focusIndex !== null) {
      return (
        <TopicDeck
          key={`focus-${focusIndex}-${focusTopics[0].id}`}
          topics={focusTopics}
          leftLabel="Skip"
          rightLabel="Studied"
          leftStatus="skipped"
          rightStatus="studied"
          positionOffset={focusIndex}
          totalCount={topicTotal || allTopics.length}
          onActiveTopicChange={handleActiveTopicChange}
          onComplete={(s) => {
            applyDeckProgress(s);
            void loadAllTopics("unstudied");
          }}
        />
      );
    }

    if (mode === "done") {
      return (
        <div className="panel fade-up p-6 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl">
            Session complete
          </p>
          <p className="mt-3 text-[var(--muted)]">
            Studied <span className="text-[var(--studied)]">{stats.right}</span> ·
            Skipped <span className="text-[var(--skipped)]">{stats.left}</span>
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={() => void loadAllTopics("unstudied")}
            >
              Continue studying
            </button>
          </div>
        </div>
      );
    }

    if (unstudiedTopics.length === 0) {
      return (
        <div className="panel p-5 text-sm text-[var(--muted)]">
          Nothing left to study here — pick a topic from All or mark one as Study
          again.
        </div>
      );
    }

    return (
      <TopicDeck
        key={`deck-${deckKey}-${unstudiedTopics[0]?.id ?? "none"}`}
        topics={unstudiedTopics}
        leftLabel="Skip"
        rightLabel="Studied"
        leftStatus="skipped"
        rightStatus="studied"
        completedCount={studiedCount}
        totalCount={topicTotal}
        onActiveTopicChange={handleActiveTopicChange}
        onComplete={(s) => {
          applyDeckProgress(s);
          setMode("done");
        }}
      />
    );
  }

  return (
    <main className="app-shell app-shell-study">
      <header className="mb-4 flex shrink-0 items-center justify-between gap-3">
        {mode === "focus" ? (
          <button
            type="button"
            onClick={clearFocus}
            className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <span className="md:hidden">← All topics</span>
            <span className="hidden md:inline">← Back to queue</span>
          </button>
        ) : (
          <Link
            href="/"
            className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          >
            ← Categories
          </Link>
        )}
        {mode !== "focus" && (
          <div className="study-filter-tabs flex rounded-full border border-[var(--line)] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => syncModeAfterFilter("unstudied")}
              className={`rounded-full px-3 py-1 ${
                filter === "unstudied"
                  ? "bg-[var(--accent)] text-[#041018]"
                  : "text-[var(--muted)]"
              }`}
            >
              To study
            </button>
            <button
              type="button"
              onClick={() => syncModeAfterFilter("all")}
              className={`rounded-full px-3 py-1 ${
                filter === "all"
                  ? "bg-[var(--accent)] text-[#041018]"
                  : "text-[var(--muted)]"
              }`}
            >
              All
            </button>
          </div>
        )}
      </header>

      <h1 className="mb-4 shrink-0 font-[family-name:var(--font-display)] text-2xl">
        {categoryName}
      </h1>

      {/* Desktop: study card left, All topics right */}
      <div className="study-split">
        <section className="study-split-deck min-h-0">
          <div className="mb-2 shrink-0">
            <p className="font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
              {mode === "focus" ? "Focused card" : "To study"}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {mode === "focus"
                ? "Esc to return to the queue"
                : `${unstudiedTopics.length} remaining`}
            </p>
          </div>
          <div className="min-h-0 flex-1">{renderDeckPanel()}</div>
        </section>

        <section className="study-split-list">
          <div className="shrink-0 border-b border-[var(--line)] px-3.5 py-3">
            <p className="font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
              All topics
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {allTopics.length} topics · {studiedCount} studied
            </p>
          </div>
          <div className="study-split-list-scroll" ref={listScrollRef}>
            {mode === "loading" ? (
              <p className="px-1 text-sm text-[var(--muted)]">Loading…</p>
            ) : allTopics.length === 0 ? (
              <p className="px-1 text-sm text-[var(--muted)]">
                No topics in this category.
              </p>
            ) : (
              renderTopicList(allTopics, { compact: true })
            )}
          </div>
        </section>
      </div>

      {/* Mobile: To study / All toggle (unchanged interaction) */}
      <div className="study-mobile-only">
        {mode === "loading" && (
          <p className="text-[var(--muted)]">Loading topics…</p>
        )}

        {mode === "empty" && (
          <div className="panel p-5 text-sm text-[var(--muted)]">
            {filter === "unstudied"
              ? "Nothing left to study here — switch to All or pick another category."
              : "No topics in this category."}
          </div>
        )}

        {mode === "list" && (
          <div
            className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-6"
            ref={mobileListScrollRef}
          >
            <p className="mb-3 text-sm text-[var(--muted)]">
              {mobileTopics.length} topics ·{" "}
              {mobileTopics.filter((t) => isStudiedStatus(t.status)).length}{" "}
              studied
            </p>
            <p className="mb-3 text-xs text-[var(--muted)]">
              Tap a topic to open its card. Use{" "}
              <span className="text-[var(--accent)]">Study again</span> on
              Studied items to return them to To study.
            </p>
            {renderTopicList(mobileTopics)}
          </div>
        )}

        {mode === "deck" && unstudiedTopics.length > 0 && (
          <TopicDeck
            key={`m-deck-${deckKey}-${unstudiedTopics[0].id}`}
            topics={unstudiedTopics}
            leftLabel="Skip"
            rightLabel="Studied"
            leftStatus="skipped"
            rightStatus="studied"
            completedCount={studiedCount}
            totalCount={topicTotal}
            onActiveTopicChange={handleActiveTopicChange}
            onComplete={(s) => {
              applyDeckProgress(s);
              setMode("done");
            }}
          />
        )}

        {mode === "focus" && focusTopics.length > 0 && focusIndex !== null && (
          <TopicDeck
            key={`m-focus-${focusIndex}-${focusTopics[0].id}`}
            topics={focusTopics}
            leftLabel="Skip"
            rightLabel="Studied"
            leftStatus="skipped"
            rightStatus="studied"
            positionOffset={focusIndex}
            totalCount={topicTotal || allTopics.length}
            onActiveTopicChange={handleActiveTopicChange}
            onComplete={(s) => {
              applyDeckProgress(s);
              void loadAllTopics("all");
            }}
          />
        )}

        {mode === "done" && (
          <div className="panel fade-up p-6 text-center">
            <p className="font-[family-name:var(--font-display)] text-2xl">
              Session complete
            </p>
            <p className="mt-3 text-[var(--muted)]">
              Studied <span className="text-[var(--studied)]">{stats.right}</span> ·
              Skipped <span className="text-[var(--skipped)]">{stats.left}</span>
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                className="btn-primary"
                onClick={() => void loadAllTopics("unstudied")}
              >
                Continue studying
              </button>
              <button
                type="button"
                className="rounded-xl border border-[var(--line)] py-3 text-sm text-[var(--ink-soft)]"
                onClick={() => syncModeAfterFilter("all")}
              >
                View all topics
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
