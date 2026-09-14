"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Overview = {
  users: {
    total_users: number;
    pending_users: number;
    allowed_users: number;
    admin_users: number;
    users_with_gemini: number;
  };
  content: {
    categories: number;
    topics: number;
    missing_guides: number;
  };
  activity: {
    progress_rows: number;
    drill_sessions: number;
    drills_7d: number;
    active_learners_7d: number;
  };
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/overview");
    if (!res.ok) {
      setError("Could not load overview");
      return;
    }
    setData(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return <p className="admin-error">{error}</p>;
  }

  if (!data) {
    return <p className="admin-muted">Loading overview…</p>;
  }

  const cards = [
    {
      label: "Pending approvals",
      value: data.users.pending_users,
      href: "/admin/approvals",
      tone: "warn" as const,
    },
    {
      label: "Allowed users",
      value: data.users.allowed_users,
      href: "/admin/users",
    },
    {
      label: "Gemini keys saved",
      value: data.users.users_with_gemini,
    },
    {
      label: "Categories",
      value: data.content.categories,
      href: "/admin/content",
    },
    {
      label: "Topics",
      value: data.content.topics,
      href: "/admin/content",
    },
    {
      label: "Missing guides",
      value: data.content.missing_guides,
      href: "/admin/content",
      tone: data.content.missing_guides > 0 ? ("warn" as const) : undefined,
    },
    {
      label: "Active learners (7d)",
      value: data.activity.active_learners_7d,
      href: "/admin/insights",
    },
    {
      label: "Drills (7d)",
      value: data.activity.drills_7d,
      href: "/admin/insights",
    },
  ];

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Dashboard</p>
          <h2 className="admin-title">Overview</h2>
        </div>
      </header>

      <div className="admin-stat-grid">
        {cards.map((card) => {
          const inner = (
            <>
              <p className="admin-stat-label">{card.label}</p>
              <p className="admin-stat-value">{card.value}</p>
            </>
          );
          const className = `admin-stat${card.tone === "warn" ? " is-warn" : ""}`;
          return card.href ? (
            <Link key={card.label} href={card.href} className={className}>
              {inner}
            </Link>
          ) : (
            <div key={card.label} className={className}>
              {inner}
            </div>
          );
        })}
      </div>

      <section className="admin-panel mt-6">
        <h3 className="admin-section-title">Quick actions</h3>
        <div className="admin-actions">
          <Link href="/admin/approvals" className="btn-primary">
            Review pending users
          </Link>
          <Link href="/admin/content" className="admin-secondary-btn">
            Content coverage
          </Link>
          <Link href="/admin/insights" className="admin-secondary-btn">
            Learning insights
          </Link>
        </div>
      </section>
    </div>
  );
}
