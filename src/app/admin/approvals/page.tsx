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

export default function AdminApprovalsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/users?filter=pending");
    if (!res.ok) {
      setError("Could not load pending users");
      return;
    }
    const data = await res.json();
    setUsers(data.users as AdminUser[]);
  }, []);

  useEffect(() => {
    void load();
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
          <p className="admin-kicker">Access</p>
          <h2 className="admin-title">Approvals</h2>
          <p className="admin-subtitle">
            New signups wait here until you allow them to sign in.
          </p>
        </div>
      </header>

      {error ? <p className="admin-error">{error}</p> : null}

      {users.length === 0 ? (
        <div className="admin-panel">
          <p className="admin-muted">No pending approvals.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Signed up</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link href={`/admin/users/${u.id}`} className="admin-link">
                      {u.username}
                    </Link>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td className="admin-row-actions">
                    <button
                      type="button"
                      className="btn-primary admin-table-btn"
                      disabled={busyId === u.id}
                      onClick={() => void setAllow(u.id, true)}
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
