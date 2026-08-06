"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopicDeck } from "@/components/TopicDeck";
import type { CardTopic } from "@/components/SwipeCard";

const COUNTS = [10, 20, 30, 50] as const;

type Category = {
  id: number;
  name: string;
  topic_count: number;
};

type Phase = "setup" | "loading" | "deck" | "done";

export default function RandomPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [count, setCount] = useState<(typeof COUNTS)[number]>(10);
  const [topics, setTopics] = useState<CardTopic[]>([]);
  const [phase, setPhase] = useState<Phase>("setup");
  const [stats, setStats] = useState({ right: 0, left: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.categories ?? []) as Category[];
        setCategories(list);
        if (list[0]) setCategoryId(list[0].id);
      })
      .catch(() => setError("Could not load categories"));
  }, []);

  async function startSession() {
    if (!categoryId) return;
    setError("");
    setPhase("loading");
    try {
      const res = await fetch(
        `/api/random?categoryId=${categoryId}&count=${count}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start");
        setPhase("setup");
        return;
      }
      const list = (data.topics ?? []) as CardTopic[];
      if (!list.length) {
        setError("No topics with guides in this category.");
        setPhase("setup");
        return;
      }
      setTopics(list);
      setPhase("deck");
    } catch {
      setError("Network error");
      setPhase("setup");
    }
  }

  return (
    <main className="app-shell">
      <header className="mb-6">
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          ← Categories
        </Link>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl">
          Random drill
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Double-tap a card to reveal the guide, then swipe right if you got it
          or left if you missed it.
        </p>
      </header>

      {phase === "setup" && (
        <div className="panel fade-up space-y-5 p-5">
          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">
              Category
            </label>
            <select
              className="field"
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.topic_count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm text-[var(--muted)]">Questions</p>
            <div className="grid grid-cols-4 gap-2">
              {COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={`rounded-xl border py-3 text-sm font-medium transition ${
                    count === n
                      ? "border-[var(--accent)] bg-[var(--studied-soft)] text-[var(--accent)]"
                      : "border-[var(--line)] text-[var(--ink-soft)]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-[var(--skipped-soft)] px-3 py-2 text-sm text-[var(--skipped)]">
              {error}
            </p>
          )}

          <button type="button" className="btn-primary w-full" onClick={startSession}>
            Start session
          </button>
        </div>
      )}

      {phase === "loading" && (
        <p className="text-[var(--muted)]">Shuffling questions…</p>
      )}

      {phase === "deck" && (
        <div className="min-h-0 flex-1">
          <TopicDeck
            topics={topics}
            revealMode
            leftLabel="Missed"
            rightLabel="Got it"
            leftStatus="failed"
            rightStatus="correct"
            onComplete={(s) => {
              setStats(s);
              setPhase("done");
            }}
          />
        </div>
      )}

      {phase === "done" && (
        <div className="panel fade-up p-6 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl">
            Drill finished
          </p>
          <p className="mt-3 text-[var(--muted)]">
            Correct <span className="text-[var(--studied)]">{stats.right}</span> ·
            Missed <span className="text-[var(--skipped)]">{stats.left}</span>
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Accuracy{" "}
            {stats.right + stats.left > 0
              ? Math.round((stats.right / (stats.right + stats.left)) * 100)
              : 0}
            %
          </p>
          <button
            type="button"
            className="btn-primary mt-6 w-full"
            onClick={() => setPhase("setup")}
          >
            New session
          </button>
        </div>
      )}
    </main>
  );
}
