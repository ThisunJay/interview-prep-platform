"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TopicDeck } from "@/components/TopicDeck";
import type { CardTopic } from "@/components/SwipeCard";
import { ProfileMenu } from "@/components/ProfileMenu";

const COUNTS = [10, 20, 30, 50] as const;

type Category = {
  id: number;
  name: string;
  topic_count: number;
};

type DrillRow = {
  id: number;
  category_id: number;
  category_name: string;
  question_count: number;
  correct_count: number;
  missed_count: number;
  accuracy: number;
  created_at: string;
};

type Phase = "setup" | "loading" | "deck" | "done";
type HistoryTab = "recent" | "best";

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function RandomPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [count, setCount] = useState<(typeof COUNTS)[number]>(10);
  const [topics, setTopics] = useState<CardTopic[]>([]);
  const [phase, setPhase] = useState<Phase>("setup");
  const [stats, setStats] = useState({ right: 0, left: 0 });
  const [error, setError] = useState("");
  const [historyTab, setHistoryTab] = useState<HistoryTab>("recent");
  const [drills, setDrills] = useState<DrillRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const savedRef = useRef(false);

  const loadHistory = useCallback(async (sort: HistoryTab) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/drills?sort=${sort}&limit=10`);
      if (!res.ok) {
        setDrills([]);
        return;
      }
      const data = await res.json();
      setDrills((data.drills ?? []) as DrillRow[]);
    } catch {
      setDrills([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

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

  useEffect(() => {
    if (phase === "setup") {
      void loadHistory(historyTab);
    }
  }, [phase, historyTab, loadHistory]);

  async function startSession() {
    if (!categoryId) return;
    setError("");
    savedRef.current = false;
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

  async function finishDrill(s: { right: number; left: number }) {
    setStats(s);
    setPhase("done");

    if (!categoryId || savedRef.current) return;
    savedRef.current = true;
    try {
      await fetch("/api/drills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          questionCount: topics.length,
          correctCount: s.right,
          missedCount: s.left,
        }),
      });
    } catch {
      // result screen still shows; history refreshes next setup visit
      savedRef.current = false;
    }
  }

  const shellClass =
    phase === "deck" ? "app-shell app-shell-deck" : "app-shell";

  return (
    <main className={shellClass}>
      <header className="mb-6 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
            ← Categories
          </Link>
          <ProfileMenu />
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl">
          Random drill
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          <span className="deck-hint-mobile">
            Double-tap a card to reveal the guide, then swipe right if you got it
            or left if you missed it.
          </span>
          <span className="deck-hint-desktop">
            Press Space to reveal, then ← Missed / → Got it (or the buttons).
          </span>
        </p>
      </header>

      {phase === "setup" && (
        <div className="grid gap-6 pb-8 md:grid-cols-2 md:items-start">
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

            <button
              type="button"
              className="btn-primary w-full"
              onClick={startSession}
            >
              Start session
            </button>
          </div>

          <section className="fade-up" style={{ animationDelay: "80ms" }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-[family-name:var(--font-display)] text-lg">
                Your drills
              </h2>
              <div className="flex rounded-full border border-[var(--line)] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setHistoryTab("recent")}
                  className={`rounded-full px-3 py-1 ${
                    historyTab === "recent"
                      ? "bg-[var(--accent)] text-[#041018]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  Most recent
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTab("best")}
                  className={`rounded-full px-3 py-1 ${
                    historyTab === "best"
                      ? "bg-[var(--accent)] text-[#041018]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  Best scored
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
              <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-black/25 text-xs uppercase tracking-wide text-[var(--muted)]">
                    <th className="px-3 py-2.5 font-medium">When</th>
                    <th className="px-3 py-2.5 font-medium">Category</th>
                    <th className="px-3 py-2.5 font-medium">Score</th>
                    <th className="px-3 py-2.5 font-medium">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-[var(--muted)]"
                      >
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!historyLoading && drills.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-[var(--muted)]"
                      >
                        No drills yet — finish a session to see it here.
                      </td>
                    </tr>
                  )}
                  {!historyLoading &&
                    drills.map((d) => (
                      <tr
                        key={d.id}
                        className="border-b border-[var(--line)] last:border-b-0"
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 text-[var(--muted)]">
                          {formatWhen(d.created_at)}
                        </td>
                        <td className="px-3 py-2.5 text-[var(--ink)]">
                          {d.category_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className="text-[var(--studied)]">
                            {d.correct_count}
                          </span>
                          <span className="text-[var(--muted)]">
                            /{d.question_count}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[var(--accent)]">
                          {Math.round(Number(d.accuracy))}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
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
            onComplete={finishDrill}
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
