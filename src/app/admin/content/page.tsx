"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

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
    categoryId?: number;
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
            Browse categories and edit topic guides in the database. Reseed with{" "}
            <code className="text-[var(--accent)]">npm run seed</code> may
            overwrite DB edits from markdown.
          </p>
        </div>
      </header>

      <section className="admin-panel">
        <h3 className="admin-section-title">Categories</h3>

        <div className="admin-table-wrap admin-desktop-only">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Topics</th>
                <th>Missing guides</th>
                <th>Learners touched</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.categories.map((c) => (
                <tr key={c.id}>
                  <td data-label="Name">
                    <Link href={`/admin/content/${c.id}`} className="admin-link">
                      {c.name}
                    </Link>
                  </td>
                  <td data-label="Slug">
                    <code>{c.slug}</code>
                  </td>
                  <td data-label="Topics">{c.topicCount}</td>
                  <td
                    data-label="Missing guides"
                    className={
                      c.missingGuideCount > 0 ? "text-[var(--skipped)]" : ""
                    }
                  >
                    {c.missingGuideCount}
                  </td>
                  <td data-label="Learners">{c.learnersStudied}</td>
                  <td className="admin-row-actions">
                    <Link
                      href={`/admin/content/${c.id}`}
                      className="btn-primary admin-table-btn"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-card-list admin-mobile-only">
          {data.categories.map((c) => (
            <article key={c.id} className="admin-card">
              <div className="admin-card-head">
                <div>
                  <Link
                    href={`/admin/content/${c.id}`}
                    className="admin-link"
                    style={{ fontSize: "1.05rem" }}
                  >
                    {c.name}
                  </Link>
                  <p className="admin-card-meta" style={{ textAlign: "left" }}>
                    <code>{c.slug}</code>
                  </p>
                </div>
                {c.missingGuideCount > 0 ? (
                  <span className="admin-status is-blocked">
                    {c.missingGuideCount} missing
                  </span>
                ) : (
                  <span className="admin-status is-ok">Complete</span>
                )}
              </div>
              <dl className="admin-card-meta-grid">
                <div>
                  <dt>Topics</dt>
                  <dd>{c.topicCount}</dd>
                </div>
                <div>
                  <dt>Missing guides</dt>
                  <dd>{c.missingGuideCount}</dd>
                </div>
                <div>
                  <dt>Learners touched</dt>
                  <dd>{c.learnersStudied}</dd>
                </div>
              </dl>
              <div className="admin-card-actions">
                <Link
                  href={`/admin/content/${c.id}`}
                  className="btn-primary admin-table-btn"
                  style={{ textAlign: "center" }}
                >
                  Open topics
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel mt-6">
        <h3 className="admin-section-title">Attention topics</h3>
        <p className="admin-subtitle mb-3">
          Missing guides or high skip/fail marks — open a topic to edit its
          guide.
        </p>
        {data.weakTopics.length === 0 ? (
          <p className="admin-muted">Nothing flagged.</p>
        ) : (
          <>
            <div className="admin-table-wrap admin-desktop-only">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Category</th>
                    <th>Skipped</th>
                    <th>Failed</th>
                    <th>Studied</th>
                    <th>Guide</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.weakTopics.map((t) => (
                    <tr key={t.id}>
                      <td data-label="Topic">
                        {t.categoryId ? (
                          <Link
                            href={`/admin/content/${t.categoryId}/${t.id}`}
                            className="admin-link"
                          >
                            {t.title}
                          </Link>
                        ) : (
                          t.title
                        )}
                      </td>
                      <td data-label="Category">{t.categoryName}</td>
                      <td data-label="Skipped">{t.skippedCount}</td>
                      <td data-label="Failed">{t.failedCount}</td>
                      <td data-label="Studied">{t.studiedCount}</td>
                      <td data-label="Guide">
                        {t.missingGuide ? (
                          <span className="admin-status is-blocked">Missing</span>
                        ) : (
                          <span className="admin-status is-ok">OK</span>
                        )}
                      </td>
                      <td className="admin-row-actions">
                        {t.categoryId ? (
                          <Link
                            href={`/admin/content/${t.categoryId}/${t.id}`}
                            className="admin-secondary-btn admin-table-btn"
                          >
                            Edit
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-card-list admin-mobile-only">
              {data.weakTopics.map((t) => (
                <article key={t.id} className="admin-card">
                  <div className="admin-card-head">
                    <div>
                      {t.categoryId ? (
                        <Link
                          href={`/admin/content/${t.categoryId}/${t.id}`}
                          className="admin-link"
                        >
                          {t.title}
                        </Link>
                      ) : (
                        <span className="admin-link">{t.title}</span>
                      )}
                      <p
                        className="admin-card-meta"
                        style={{ textAlign: "left" }}
                      >
                        {t.categoryName}
                      </p>
                    </div>
                    <span
                      className={`admin-status${
                        t.missingGuide ? " is-blocked" : " is-ok"
                      }`}
                    >
                      {t.missingGuide ? "Missing" : "OK"}
                    </span>
                  </div>
                  <dl className="admin-card-meta-grid">
                    <div>
                      <dt>Skipped</dt>
                      <dd>{t.skippedCount}</dd>
                    </div>
                    <div>
                      <dt>Failed</dt>
                      <dd>{t.failedCount}</dd>
                    </div>
                    <div>
                      <dt>Studied</dt>
                      <dd>{t.studiedCount}</dd>
                    </div>
                  </dl>
                  {t.categoryId ? (
                    <div className="admin-card-actions">
                      <Link
                        href={`/admin/content/${t.categoryId}/${t.id}`}
                        className="admin-secondary-btn admin-table-btn"
                        style={{ textAlign: "center" }}
                      >
                        Edit guide
                      </Link>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
