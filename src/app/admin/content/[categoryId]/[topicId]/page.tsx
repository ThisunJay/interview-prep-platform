"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type TopicDetail = {
  id: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  title: string;
  section: string | null;
  sortOrder: number;
  description: string;
  missingGuide: boolean;
};

export default function AdminTopicEditorPage() {
  const params = useParams();
  const categoryId = String(params.categoryId ?? "");
  const topicId = String(params.topicId ?? "");

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/admin/topics/${topicId}`);
    if (!res.ok) {
      setError("Could not load topic");
      setTopic(null);
      return;
    }
    const data = await res.json();
    const t = data.topic as TopicDetail;
    setTopic(t);
    setTitle(t.title);
    setSection(t.section ?? "");
    setSortOrder(t.sortOrder);
    setDescription(t.description);
  }, [topicId]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => {
    if (!topic) return false;
    return (
      title.trim() !== topic.title ||
      (section.trim() || null) !== (topic.section ?? null) ||
      sortOrder !== topic.sortOrder ||
      description !== topic.description
    );
  }, [topic, title, section, sortOrder, description]);

  async function onSave() {
    if (!topic || saving) return;
    setSaving(true);
    setError(null);
    setSavedFlash(false);
    try {
      const res = await fetch(`/api/admin/topics/${topic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          section: section.trim() ? section.trim() : null,
          sortOrder,
          description,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Could not save topic"
        );
      }
      const next = (data as { topic: TopicDetail }).topic;
      setTopic(next);
      setTitle(next.title);
      setSection(next.section ?? "");
      setSortOrder(next.sortOrder);
      setDescription(next.description);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save topic");
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    if (!topic) return;
    setTitle(topic.title);
    setSection(topic.section ?? "");
    setSortOrder(topic.sortOrder);
    setDescription(topic.description);
    setError(null);
  }

  if (!topic && !error) {
    return <p className="admin-muted">Loading guide…</p>;
  }

  if (!topic) {
    return (
      <div className="admin-page">
        <p className="admin-error">{error ?? "Topic not found"}</p>
        <Link href={`/admin/content/${categoryId}`} className="admin-link">
          ← Topics
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <Link
            href={`/admin/content/${topic.categoryId}`}
            className="admin-back"
          >
            ← {topic.categoryName}
          </Link>
          <h2 className="admin-title mt-2">Edit guide</h2>
          <p className="admin-subtitle">
            Changes save to the database used by study cards. Running{" "}
            <code className="text-[var(--accent)]">npm run seed</code> from
            markdown can overwrite them.
          </p>
        </div>
        <div className="admin-actions">
          <button
            type="button"
            className="admin-secondary-btn"
            disabled={!dirty || saving}
            onClick={onReset}
          >
            Reset
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!dirty || saving || !title.trim()}
            onClick={() => void onSave()}
          >
            {saving ? "Saving…" : savedFlash ? "Saved" : "Save guide"}
          </button>
        </div>
      </header>

      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-editor-meta">
        <label className="admin-field">
          <span>Title</span>
          <input
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="admin-field">
          <span>Section</span>
          <input
            className="field"
            value={section}
            placeholder="Optional section heading"
            onChange={(e) => setSection(e.target.value)}
          />
        </label>
        <label className="admin-field admin-field-narrow">
          <span>Sort order</span>
          <input
            className="field"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <div className="admin-editor-toolbar">
        <div className="admin-filter-tabs">
          <button
            type="button"
            className={`admin-filter-tab${mode === "edit" ? " is-active" : ""}`}
            onClick={() => setMode("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            className={`admin-filter-tab${mode === "preview" ? " is-active" : ""}`}
            onClick={() => setMode("preview")}
          >
            Preview
          </button>
        </div>
        <p className="admin-muted">
          {description.length.toLocaleString()} characters
          {dirty ? " · unsaved changes" : ""}
        </p>
      </div>

      {mode === "edit" ? (
        <textarea
          className="field admin-guide-editor"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          spellCheck={false}
          placeholder="Write the guide in Markdown…"
        />
      ) : (
        <div className="admin-panel admin-guide-preview prose-prep">
          {description.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {description}
            </ReactMarkdown>
          ) : (
            <p className="admin-muted">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
