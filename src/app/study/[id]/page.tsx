"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TopicDeck } from "@/components/TopicDeck";
import type { CardTopic } from "@/components/SwipeCard";

type TopicRow = CardTopic & {
  status?: string | null;
  section?: string | null;
};

type Mode = "loading" | "deck" | "list" | "done" | "empty";

function statusMeta(status: string | null | undefined) {
  switch (status) {
    case "studied":
    case "correct":
      return { label: "Studied", className: "text-[var(--studied)] bg-[var(--studied-soft)]" };
    case "skipped":
      return { label: "Skipped", className: "text-[var(--skipped)] bg-[var(--skipped-soft)]" };
    case "failed":
      return { label: "Missed", className: "text-[var(--skipped)] bg-[var(--skipped-soft)]" };
    default:
      return { label: "Not started", className: "text-[var(--muted)] bg-black/25" };
  }
}

export default function StudyPage() {
  const params = useParams<{ id: string }>();
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [topicTotal, setTopicTotal] = useState(0);
  const [studiedCount, setStudiedCount] = useState(0);
  const [mode, setMode] = useState<Mode>("loading");
  const [stats, setStats] = useState({ right: 0, left: 0 });
  const [filter, setFilter] = useState<"all" | "unstudied">("unstudied");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setMode("loading");
      const [topicsRes, catsRes] = await Promise.all([
        fetch(`/api/topics?categoryId=${params.id}&filter=${filter}`),
        fetch("/api/categories"),
      ]);

      if (!topicsRes.ok) {
        if (!cancelled) setMode("empty");
        return;
      }

      const topicsData = await topicsRes.json();
      const catsData = catsRes.ok ? await catsRes.json() : { categories: [] };
      const cat = catsData.categories?.find(
        (c: { id: number }) => String(c.id) === String(params.id)
      );

      if (cancelled) return;

      setCategoryName(cat?.name ?? "Category");
      setTopicTotal(Number(cat?.topic_count ?? 0));
      setStudiedCount(Number(cat?.studied_count ?? 0));
      const list = (topicsData.topics ?? []) as TopicRow[];
      setTopics(list);

      if (!list.length) {
        setMode("empty");
      } else if (filter === "all") {
        setMode("list");
      } else {
        setMode("deck");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id, filter]);

  const shellClass =
    filter === "all" ? "app-shell" : "app-shell app-shell-deck";

  return (
    <main className={shellClass}>
      <header className="mb-4 flex shrink-0 items-center justify-between gap-3">
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          ← Categories
        </Link>
        <div className="flex rounded-full border border-[var(--line)] p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setFilter("unstudied")}
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
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 ${
              filter === "all"
                ? "bg-[var(--accent)] text-[#041018]"
                : "text-[var(--muted)]"
            }`}
          >
            All
          </button>
        </div>
      </header>

      <h1 className="mb-4 shrink-0 font-[family-name:var(--font-display)] text-2xl">
        {categoryName}
      </h1>

      <div className={filter === "all" ? "flex-1" : "min-h-0 flex-1"}>
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
          <div className="space-y-2 pb-6">
            <p className="mb-3 text-sm text-[var(--muted)]">
              {topics.length} topics ·{" "}
              {
                topics.filter(
                  (t) => t.status === "studied" || t.status === "correct"
                ).length
              }{" "}
              studied
            </p>
            <p className="mb-3 text-xs text-[var(--muted)]">
              Tap <span className="text-[var(--accent)]">Study again</span> on a
              Studied topic to put it back in To study.
            </p>
            <ul className="space-y-2">
              {topics.map((topic) => {
                const meta = statusMeta(topic.status);
                const isStudied =
                  topic.status === "studied" || topic.status === "correct";
                return (
                  <li
                    key={topic.id}
                    className="rounded-xl border border-[var(--line)] bg-[rgba(10,22,34,0.55)] px-3.5 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {topic.section && (
                          <p className="mb-0.5 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                            {topic.section}
                          </p>
                        )}
                        <p className="font-medium leading-snug text-[var(--ink)]">
                          {topic.title}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                        {isStudied && (
                          <button
                            type="button"
                            className="text-[11px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                            onClick={async () => {
                              const res = await fetch("/api/progress", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ topicId: topic.id }),
                              });
                              if (!res.ok) return;
                              setTopics((prev) =>
                                prev.map((t) =>
                                  t.id === topic.id
                                    ? { ...t, status: null }
                                    : t
                                )
                              );
                              setStudiedCount((c) => Math.max(0, c - 1));
                            }}
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
          </div>
        )}

        {mode === "deck" && topics.length > 0 && (
          <TopicDeck
            key={`deck-${studiedCount}-${topics.length}-${topics[0].id}`}
            topics={topics}
            leftLabel="Skip"
            rightLabel="Studied"
            leftStatus="skipped"
            rightStatus="studied"
            completedCount={studiedCount}
            totalCount={topicTotal}
            onComplete={(s) => {
              setStats(s);
              setStudiedCount((c) => c + s.right);
              setMode("done");
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
                onClick={() => {
                  setMode("loading");
                  void fetch(
                    `/api/topics?categoryId=${params.id}&filter=unstudied`
                  )
                    .then((r) => r.json())
                    .then((d) => {
                      const list = (d.topics ?? []) as TopicRow[];
                      setFilter("unstudied");
                      setTopics(list);
                      setMode(list.length ? "deck" : "empty");
                    });
                }}
              >
                Continue studying
              </button>
              <button
                type="button"
                className="rounded-xl border border-[var(--line)] py-3 text-sm text-[var(--ink-soft)]"
                onClick={() => setFilter("all")}
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
