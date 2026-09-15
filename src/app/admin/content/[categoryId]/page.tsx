"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type TopicRow = {
  id: number;
  title: string;
  section: string | null;
  sortOrder: number;
  descriptionLength: number;
  missingGuide: boolean;
  descriptionPreview: string;
  studiedCount: number;
  skippedCount: number;
  failedCount: number;
};

type Payload = {
  category: {
    id: number;
    name: string;
    slug: string;
  };
  topics: TopicRow[];
};

export default function AdminCategoryTopicsPage() {
  const params = useParams();
  const categoryId = String(params.categoryId ?? "");
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [guideFilter, setGuideFilter] = useState<"all" | "missing" | "ok">("all");

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/admin/categories/${categoryId}`);
    if (!res.ok) {
      setError("Could not load category");
      setData(null);
      return;
    }
    setData(await res.json());
  }, [categoryId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const query = q.trim().toLowerCase();
    return data.topics.filter((t) => {
      if (guideFilter === "missing" && !t.missingGuide) return false;
      if (guideFilter === "ok" && t.missingGuide) return false;
      if (!query) return true;
      return (
        t.title.toLowerCase().includes(query) ||
        (t.section ?? "").toLowerCase().includes(query)
      );
    });
  }, [data, q, guideFilter]);

  const sections = useMemo(() => {
    const map = new Map<string, TopicRow[]>();
    for (const topic of filtered) {
      const key = topic.section?.trim() || "Unsectioned";
      const list = map.get(key) ?? [];
      list.push(topic);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (!data && !error) {
    return <p className="admin-muted">Loading topics…</p>;
  }

  if (!data) {
    return (
      <div className="admin-page">
        <p className="admin-error">{error ?? "Category not found"}</p>
        <Link href="/admin/content" className="admin-link">
          ← Content
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <Link href="/admin/content" className="admin-back">
            ← Content
          </Link>
          <h2 className="admin-title mt-2">{data.category.name}</h2>
          <p className="admin-subtitle">
            {data.topics.length} topics ·{" "}
            <code>{data.category.slug}</code>
          </p>
        </div>
      </header>

      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-toolbar">
        <div className="admin-filter-tabs">
          {(["all", "missing", "ok"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`admin-filter-tab${guideFilter === f ? " is-active" : ""}`}
              onClick={() => setGuideFilter(f)}
            >
              {f === "all" ? "All" : f === "missing" ? "Missing guides" : "Has guide"}
            </button>
          ))}
        </div>
        <input
          className="field admin-search"
          placeholder="Search topics…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="admin-panel">
          <p className="admin-muted">No topics match.</p>
        </div>
      ) : (
        <div className="admin-topic-sections">
          {sections.map(([section, topics]) => (
            <section key={section} className="admin-panel">
              <h3 className="admin-section-title">{section}</h3>

              <div className="admin-table-wrap admin-desktop-only">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Order</th>
                      <th>Guide</th>
                      <th>Studied</th>
                      <th>Skipped</th>
                      <th>Failed</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {topics.map((t) => (
                      <tr key={t.id}>
                        <td data-label="Topic">
                          <Link
                            href={`/admin/content/${data.category.id}/${t.id}`}
                            className="admin-link"
                          >
                            {t.title}
                          </Link>
                        </td>
                        <td data-label="Order">{t.sortOrder}</td>
                        <td data-label="Guide">
                          {t.missingGuide ? (
                            <span className="admin-status is-blocked">Missing</span>
                          ) : (
                            <span className="admin-status is-ok">
                              {t.descriptionLength.toLocaleString()} chars
                            </span>
                          )}
                        </td>
                        <td data-label="Studied">{t.studiedCount}</td>
                        <td data-label="Skipped">{t.skippedCount}</td>
                        <td data-label="Failed">{t.failedCount}</td>
                        <td className="admin-row-actions">
                          <Link
                            href={`/admin/content/${data.category.id}/${t.id}`}
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
                {topics.map((t) => (
                  <article key={t.id} className="admin-card">
                    <div className="admin-card-head">
                      <div>
                        <Link
                          href={`/admin/content/${data.category.id}/${t.id}`}
                          className="admin-link"
                        >
                          {t.title}
                        </Link>
                        <p
                          className="admin-card-meta"
                          style={{ textAlign: "left" }}
                        >
                          #{t.sortOrder}
                          {t.missingGuide
                            ? " · missing guide"
                            : ` · ${t.descriptionLength.toLocaleString()} chars`}
                        </p>
                      </div>
                      <span
                        className={`admin-status${
                          t.missingGuide ? " is-blocked" : " is-ok"
                        }`}
                      >
                        {t.missingGuide ? "Missing" : "Guide"}
                      </span>
                    </div>
                    <dl className="admin-card-meta-grid">
                      <div>
                        <dt>Studied</dt>
                        <dd>{t.studiedCount}</dd>
                      </div>
                      <div>
                        <dt>Skipped</dt>
                        <dd>{t.skippedCount}</dd>
                      </div>
                      <div>
                        <dt>Failed</dt>
                        <dd>{t.failedCount}</dd>
                      </div>
                    </dl>
                    {!t.missingGuide && t.descriptionPreview ? (
                      <p className="admin-topic-preview">
                        {t.descriptionPreview}…
                      </p>
                    ) : null}
                    <div className="admin-card-actions">
                      <Link
                        href={`/admin/content/${data.category.id}/${t.id}`}
                        className="btn-primary admin-table-btn"
                        style={{ textAlign: "center" }}
                      >
                        Open guide
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
