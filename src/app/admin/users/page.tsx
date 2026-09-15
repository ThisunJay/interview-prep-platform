"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type AdminUser = {
  id: number;
  username: string;
  allow: boolean;
  isSystemAdmin: boolean;
  createdAt: string;
  hasGeminiKey: boolean;
  studiedCount: number;
  drillCount: number;
};

type Filter = "all" | "pending" | "allowed";

export default function AdminUsersPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams({ filter });
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/admin/users?${params}`);
    if (!res.ok) {
      setError("Could not load users");
      return;
    }
    const data = await res.json();
    setUsers(data.users as AdminUser[]);
  }, [filter, q]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 150);
    return () => window.clearTimeout(t);
  }, [load]);

  async function setAllow(id: number, allow: boolean) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allow }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Update failed"
        );
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">People</p>
          <h2 className="admin-title">Users</h2>
        </div>
      </header>

      <div className="admin-toolbar">
        <div className="admin-filter-tabs">
          {(["all", "pending", "allowed"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`admin-filter-tab${filter === f ? " is-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          className="field admin-search"
          placeholder="Search username…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error ? <p className="admin-error">{error}</p> : null}

      {users.length === 0 ? (
        <p className="admin-muted admin-empty">No users match.</p>
      ) : (
        <div className="admin-card-list">
          {users.map((u) => (
            <article key={u.id} className="admin-card">
              <div className="admin-card-head">
                <div>
                  <Link href={`/admin/users/${u.id}`} className="admin-link">
                    {u.username}
                  </Link>
                  {u.isSystemAdmin ? (
                    <span className="admin-badge">admin</span>
                  ) : null}
                </div>
                <span
                  className={`admin-status${u.allow ? " is-ok" : " is-blocked"}`}
                >
                  {u.allow ? "Allowed" : "Blocked"}
                </span>
              </div>
              <dl className="admin-card-meta-grid">
                <div>
                  <dt>Studied</dt>
                  <dd>{u.studiedCount}</dd>
                </div>
                <div>
                  <dt>Drills</dt>
                  <dd>{u.drillCount}</dd>
                </div>
                <div>
                  <dt>Gemini</dt>
                  <dd>{u.hasGeminiKey ? "Yes" : "—"}</dd>
                </div>
                <div>
                  <dt>Joined</dt>
                  <dd>{formatDate(u.createdAt)}</dd>
                </div>
              </dl>
              <div className="admin-card-actions">
                {u.allow ? (
                  <button
                    type="button"
                    className="admin-secondary-btn admin-table-btn is-danger"
                    disabled={busyId === u.id}
                    onClick={() => void setAllow(u.id, false)}
                  >
                    Revoke
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary admin-table-btn"
                    disabled={busyId === u.id}
                    onClick={() => void setAllow(u.id, true)}
                  >
                    Approve
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}
