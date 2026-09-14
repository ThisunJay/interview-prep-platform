"use client";

import { useCallback, useEffect, useState } from "react";

type ContentPayload = {
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    topicCount: number;
    missingGuideCount: number;
    learnersStudied: number;
  }>;
  weakTopics: Array<{
    id: number;
    title: string;
    categoryName: string;
    skippedCount: number;
    failedCount: number;
    studiedCount: number;
    missingGuide: boolean;
  }>;
};

export default function AdminContentPage() {
  const [data, setData] = useState<ContentPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/content");
    if (!res.ok) {
      setError("Could not load content");
      return;
    }
    setData(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <p className="admin-error">{error}</p>;
  if (!data) return <p className="admin-muted">Loading content…</p>;

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Catalog</p>
          <h2 className="admin-title">Content</h2>
          <p className="admin-subtitle">
            Coverage from seeded markdown. Reseed with{" "}
            <code className="text-[var(--accent)]">npm run seed</code> when
            guides change.
          </p>
        </div>
      </header>

      <section className="admin-panel">
        <h3 className="admin-section-title">Categories</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Topics</th>
                <th>Missing guides</th>
                <th>Learners touched</th>
              </tr>
            </thead>
            <tbody>
              {data.categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>
                    <code>{c.slug}</code>
                  </td>
                  <td>{c.topicCount}</td>
                  <td
                    className={
                      c.missingGuideCount > 0 ? "text-[var(--skipped)]" : ""
                    }
                  >
                    {c.missingGuideCount}
                  </td>
                  <td>{c.learnersStudied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel mt-6">
        <h3 className="admin-section-title">Attention topics</h3>
        <p className="admin-subtitle mb-3">
          Missing guides or high skip/fail marks — good candidates to edit in
          markdown.
        </p>
        {data.weakTopics.length === 0 ? (
          <p className="admin-muted">Nothing flagged.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Category</th>
                  <th>Skipped</th>
                  <th>Failed</th>
                  <th>Studied</th>
                  <th>Guide</th>
                </tr>
              </thead>
              <tbody>
                {data.weakTopics.map((t) => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.categoryName}</td>
                    <td>{t.skippedCount}</td>
                    <td>{t.failedCount}</td>
                    <td>{t.studiedCount}</td>
                    <td>
                      {t.missingGuide ? (
                        <span className="admin-status is-blocked">Missing</span>
                      ) : (
                        <span className="admin-status is-ok">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
