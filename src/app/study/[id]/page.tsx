"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TopicDeck } from "@/components/TopicDeck";
import type { CardTopic } from "@/components/SwipeCard";

type Mode = "loading" | "deck" | "done" | "empty";

export default function StudyPage() {
  const params = useParams<{ id: string }>();
  const [topics, setTopics] = useState<CardTopic[]>([]);
  const [categoryName, setCategoryName] = useState("");
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
        setMode("empty");
        return;
      }

      const topicsData = await topicsRes.json();
      const catsData = catsRes.ok ? await catsRes.json() : { categories: [] };
      const cat = catsData.categories?.find(
        (c: { id: number }) => String(c.id) === String(params.id)
      );

      if (cancelled) return;

      setCategoryName(cat?.name ?? "Category");
      const list = (topicsData.topics ?? []) as CardTopic[];
      setTopics(list);
      setMode(list.length ? "deck" : "empty");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id, filter]);

  return (
    <main className="app-shell">
      <header className="mb-4 flex items-center justify-between gap-3">
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

      <h1 className="mb-4 font-[family-name:var(--font-display)] text-2xl">
        {categoryName}
      </h1>

      <div className="min-h-0 flex-1">
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

        {mode === "deck" && (
          <TopicDeck
            key={`${filter}-${topics[0]?.id ?? 0}-${topics.length}`}
            topics={topics}
            leftLabel="Skip"
            rightLabel="Studied"
            leftStatus="skipped"
            rightStatus="studied"
            onComplete={(s) => {
              setStats(s);
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
                  setFilter("unstudied");
                  setMode("loading");
                  // force reload via filter effect — if already unstudied, remount
                  setTopics([]);
                  void fetch(`/api/topics?categoryId=${params.id}&filter=unstudied`)
                    .then((r) => r.json())
                    .then((d) => {
                      const list = (d.topics ?? []) as CardTopic[];
                      setTopics(list);
                      setMode(list.length ? "deck" : "empty");
                    });
                }}
              >
                Continue studying
              </button>
              <Link
                href="/random"
                className="rounded-xl border border-[var(--line)] py-3 text-sm text-[var(--ink-soft)]"
              >
                Try random drill
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
