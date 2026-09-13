"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useUserProfile } from "@/components/UserProfileProvider";

const GEMINI_KEY_HELP_URL = "https://aistudio.google.com/apikey";

export function GeminiKeyModal() {
  const { geminiModalOpen, closeGeminiModal, refreshProfile, profile } =
    useUserProfile();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const titleId = useId();
  const tipId = useId();

  useEffect(() => {
    if (geminiModalOpen) {
      setApiKey("");
      setError(null);
    }
  }, [geminiModalOpen]);

  if (!geminiModalOpen) return null;

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/profile/gemini-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Could not save API key"
        );
      }
      await refreshProfile();
      closeGeminiModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save API key");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!profile?.hasGeminiKey) return;
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/profile/gemini-key", { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete API key");
      await refreshProfile();
      closeGeminiModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete API key");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="profile-modal-backdrop"
      role="presentation"
      onClick={closeGeminiModal}
    >
      <div
        className="profile-modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="profile-modal-title">
          {profile?.hasGeminiKey ? "Update Gemini API key" : "Set Gemini API key"}
        </h2>
        <p className="profile-modal-copy">
          Your key is encrypted at rest and never shown back in the UI. Study
          Buddy uses it only on the server for your account.
        </p>

        <div className="profile-key-tip" id={tipId}>
          <p className="profile-key-tip-label">
            How to get a key
            <span
              className="profile-tip-badge"
              title="Create a free Gemini API key in Google AI Studio, then paste it here. Prep encrypts it for your account and never shows the raw key again."
              aria-label="More info about Gemini API keys"
            >
              ?
            </span>
          </p>
          <ol>
            <li>
              Open{" "}
              <a
                href={GEMINI_KEY_HELP_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--accent)] underline-offset-2 hover:underline"
              >
                Google AI Studio
              </a>
            </li>
            <li>Sign in with your Google account</li>
            <li>Click <strong>Create API key</strong> and copy the value</li>
            <li>Paste it below (it usually starts with <code>AQ.</code> or <code>AIza</code>)</li>
          </ol>
          <p className="profile-key-privacy text-xs">
            Your key is encrypted and never shared. It is only used for your
            personal Study Buddy chats — nothing else.
          </p>
        </div>

        <form className="space-y-3" onSubmit={onSave}>
          <label className="study-buddy-label" htmlFor="profile-gemini-key">
            Gemini API Key
          </label>
          <input
            id="profile-gemini-key"
            className="field study-buddy-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder={
              profile?.hasGeminiKey ? "Enter a new key to replace…" : "AQ.… or AIzaSy…"
            }
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            aria-describedby={tipId}
            required
          />

          {error ? (
            <p className="study-buddy-error !border-0 !px-0" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={saving || !apiKey.trim()}
            >
              {saving ? "Saving…" : profile?.hasGeminiKey ? "Update key" : "Save key"}
            </button>
            <button
              type="button"
              className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-soft)]"
              onClick={closeGeminiModal}
            >
              Cancel
            </button>
          </div>
        </form>

        {profile?.hasGeminiKey ? (
          <button
            type="button"
            className="mt-3 w-full rounded-xl border border-[var(--skipped)]/40 bg-[var(--skipped-soft)] py-2.5 text-sm font-medium text-[var(--skipped)] disabled:opacity-50"
            onClick={() => void onDelete()}
            disabled={deleting}
          >
            {deleting ? "Removing…" : "Delete saved key"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
