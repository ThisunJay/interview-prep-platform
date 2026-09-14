"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Insights = {
  categoryProgress: Array<{
    id: number;
    name: string;
    topicCount: number;
    uniqueLearners: number;
    studiedMarks: number;
    skippedMarks: number;
    failedMarks: number;
    avgDrillAccuracy: number | null;
  }>;
  recentDrills: Array<{
    id: number;
    username: string;
    categoryName: string;
    questionCount: number;
    correctCount: number;
    missedCount: number;
    accuracy: number;
    createdAt: string;
  }>;
  topLearners: Array<{
    id: number;
    username: string;
    studiedCount: number;
    drillCount: number;
    avgAccuracy: number | null;
  }>;
};

export default function AdminInsightsPage() {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/insights");
    if (!res.ok) {
      setError("Could not load insights");
      return;
    }
    setData(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <p className="admin-error">{error}</p>;
  if (!data) return <p className="admin-muted">Loading insights…</p>;

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Learning</p>
          <h2 className="admin-title">Insights</h2>
          <p className="admin-subtitle">
            Cross-user progress and drill activity from stored sessions.
          </p>
        </div>
      </header>

      <section className="admin-panel">
        <h3 className="admin-section-title">By category</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Topics</th>
                <th>Learners</th>
                <th>Studied</th>
                <th>Skipped</th>
                <th>Failed</th>
                <th>Avg drill %</th>
              </tr>
            </thead>
            <tbody>
              {data.categoryProgress.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.topicCount}</td>
                  <td>{c.uniqueLearners}</td>
                  <td>{c.studiedMarks}</td>
                  <td>{c.skippedMarks}</td>
                  <td>{c.failedMarks}</td>
                  <td>
                    {c.avgDrillAccuracy == null ? "—" : `${c.avgDrillAccuracy}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-split mt-6">
        <section className="admin-panel">
          <h3 className="admin-section-title">Top learners</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Studied</th>
                  <th>Drills</th>
                  <th>Avg %</th>
                </tr>
              </thead>
              <tbody>
                {data.topLearners.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="admin-link"
                      >
                        {u.username}
                      </Link>
                    </td>
                    <td>{u.studiedCount}</td>
                    <td>{u.drillCount}</td>
                    <td>
                      {u.avgAccuracy == null ? "—" : `${u.avgAccuracy}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.topLearners.length === 0 ? (
              <p className="admin-muted admin-empty">No learner activity yet.</p>
            ) : null}
          </div>
        </section>

        <section className="admin-panel">
          <h3 className="admin-section-title">Recent drills</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Category</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {data.recentDrills.map((d) => (
                  <tr key={d.id}>
                    <td>{formatDate(d.createdAt)}</td>
                    <td>{d.username}</td>
                    <td>{d.categoryName}</td>
                    <td>
                      {d.correctCount}/{d.questionCount} ({d.accuracy}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.recentDrills.length === 0 ? (
              <p className="admin-muted admin-empty">No drills yet.</p>
            ) : null}
          </div>
        </section>
      </div>
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
