"use client";

import { useCallback, useEffect, useState } from "react";

type SystemInfo = {
  dbOk: boolean;
  dbError: string | null;
  env: {
    hasDatabaseUrl: boolean;
    hasSessionSecret: boolean;
    nodeEnv: string;
  };
  studyBuddyModel: string;
  adminUsername: string;
};

export default function AdminSystemPage() {
  const [data, setData] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/system");
    if (!res.ok) {
      setError("Could not load system status");
      return;
    }
    setData(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <p className="admin-error">{error}</p>;
  if (!data) return <p className="admin-muted">Checking system…</p>;

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Ops</p>
          <h2 className="admin-title">System</h2>
          <p className="admin-subtitle">
            Signed in as <strong>{data.adminUsername}</strong>
          </p>
        </div>
        <button type="button" className="admin-secondary-btn" onClick={() => void load()}>
          Refresh
        </button>
      </header>

      <div className="admin-stat-grid">
        <div className={`admin-stat${data.dbOk ? "" : " is-warn"}`}>
          <p className="admin-stat-label">Database</p>
          <p className="admin-stat-value text-lg">
            {data.dbOk ? "Connected" : "Error"}
          </p>
          {data.dbError ? (
            <p className="admin-stat-note">{data.dbError}</p>
          ) : null}
        </div>
        <div className="admin-stat">
          <p className="admin-stat-label">Study Buddy model</p>
          <p className="admin-stat-value text-lg">{data.studyBuddyModel}</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat-label">NODE_ENV</p>
          <p className="admin-stat-value text-lg">{data.env.nodeEnv}</p>
        </div>
      </div>

      <section className="admin-panel mt-6">
        <h3 className="admin-section-title">Environment</h3>
        <ul className="admin-checklist">
          <li className={data.env.hasDatabaseUrl ? "is-ok" : "is-bad"}>
            DATABASE_URL {data.env.hasDatabaseUrl ? "set" : "missing"}
          </li>
          <li className={data.env.hasSessionSecret ? "is-ok" : "is-bad"}>
            SESSION_SECRET {data.env.hasSessionSecret ? "set" : "missing"}
          </li>
        </ul>
      </section>

      <section className="admin-panel mt-6">
        <h3 className="admin-section-title">Admin access</h3>
        <p className="admin-subtitle">
          Grant system admin in the database (not from this UI):
        </p>
        <pre className="admin-code">{`UPDATE users
SET is_system_admin = TRUE
WHERE username = 'your_username';`}</pre>
        <p className="admin-subtitle mt-3">
          New signups default to <code>is_system_admin = false</code>. Content
          updates: run <code>npm run seed</code> from the web app.
        </p>
      </section>
    </div>
  );
}
