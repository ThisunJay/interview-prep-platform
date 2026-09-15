"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Detail = {
  user: {
    id: number;
    username: string;
    allow: boolean;
    isSystemAdmin: boolean;
    createdAt: string;
    hasGeminiKey: boolean;
    keyboardShortcutsEnabled: boolean;
  };
  categories: Array<{
    id: number;
    name: string;
    topicCount: number;
    studiedCount: number;
  }>;
  recentDrills: Array<{
    id: number;
    categoryName: string;
    questionCount: number;
    correctCount: number;
    missedCount: number;
    accuracy: number;
    createdAt: string;
  }>;
  pins: Array<{ id: number; name: string; pinnedAt: string }>;
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`);
    if (!res.ok) {
      setError("Could not load user");
      setData(null);
      return;
    }
    setData(await res.json());
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setAllow(allow: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allow }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Update failed"
        );
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  if (!data && !error) {
    return <p className="admin-muted">Loading user…</p>;
  }

  if (!data) {
    return (
      <div className="admin-page">
        <p className="admin-error">{error ?? "User not found"}</p>
        <Link href="/admin/users" className="admin-link">
          ← Users
        </Link>
      </div>
    );
  }

  const { user } = data;

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <Link href="/admin/users" className="admin-back">
            ← Users
          </Link>
          <h2 className="admin-title mt-2">{user.username}</h2>
          <p className="admin-subtitle">
            Joined {formatDate(user.createdAt)}
            {user.isSystemAdmin ? " · system admin" : ""}
          </p>
        </div>
        <div className="admin-actions">
          {user.allow ? (
            <button
              type="button"
              className="admin-secondary-btn is-danger"
              disabled={busy}
              onClick={() => void setAllow(false)}
            >
              Revoke access
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => void setAllow(true)}
            >
              Approve access
            </button>
          )}
        </div>
      </header>

      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-stat-grid">
        <div className="admin-stat">
          <p className="admin-stat-label">Access</p>
          <p className="admin-stat-value text-lg">
            {user.allow ? "Allowed" : "Blocked"}
          </p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat-label">Gemini key</p>
          <p className="admin-stat-value text-lg">
            {user.hasGeminiKey ? "Saved" : "None"}
          </p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat-label">Keyboard markers</p>
          <p className="admin-stat-value text-lg">
            {user.keyboardShortcutsEnabled ? "On" : "Off"}
          </p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat-label">Pinned categories</p>
          <p className="admin-stat-value">{data.pins.length}</p>
        </div>
      </div>

      <section className="admin-panel mt-6">
        <h3 className="admin-section-title">Progress by category</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Studied</th>
                <th>Total</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {data.categories.map((c) => {
                const pct =
                  c.topicCount > 0
                    ? Math.round((c.studiedCount / c.topicCount) * 100)
                    : 0;
                return (
                  <tr key={c.id}>
                    <td data-label="Category">{c.name}</td>
                    <td data-label="Studied">{c.studiedCount}</td>
                    <td data-label="Total">{c.topicCount}</td>
                    <td data-label="%">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel mt-6">
        <h3 className="admin-section-title">Recent drills</h3>
        {data.recentDrills.length === 0 ? (
          <p className="admin-muted">No drills yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Category</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {data.recentDrills.map((d) => (
                  <tr key={d.id}>
                    <td data-label="When">{formatDate(d.createdAt)}</td>
                    <td data-label="Category">{d.categoryName}</td>
                    <td data-label="Score">
                      {d.correctCount}/{d.questionCount}
                    </td>
                    <td data-label="Accuracy">{d.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data.pins.length > 0 ? (
        <section className="admin-panel mt-6">
          <h3 className="admin-section-title">Pins</h3>
          <ul className="admin-list">
            {data.pins.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}
