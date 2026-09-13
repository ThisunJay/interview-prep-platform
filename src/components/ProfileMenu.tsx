"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/components/UserProfileProvider";

type ProfileMenuProps = {
  /** Server-known username so the initial shows before /api/profile resolves */
  username?: string;
};

export function ProfileMenu({ username: usernameProp }: ProfileMenuProps) {
  const router = useRouter();
  const {
    profile,
    setKeyboardShortcutsEnabled,
    openGeminiModal,
  } = useUserProfile();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const username = (profile?.username || usernameProp || "").trim();
  const initial = username ? username[0]!.toUpperCase() : "?";

  return (
    <div className={`profile-menu${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="profile-avatar-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="profile-avatar-icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M5.5 19.25c1.6-3.1 4-4.75 6.5-4.75s4.9 1.65 6.5 4.75"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="profile-avatar-letter">{initial}</span>
      </button>

      {open ? (
        <div className="profile-dropdown" role="menu">
          <div className="profile-dropdown-head">
            <p className="profile-dropdown-name">{username || "Account"}</p>
            <p className="profile-dropdown-meta">
              {profile?.hasGeminiKey ? "Gemini key saved" : "No Gemini key"}
            </p>
          </div>

          <button
            type="button"
            role="menuitem"
            className="profile-dropdown-item"
            onClick={() => {
              setOpen(false);
              openGeminiModal();
            }}
          >
            {profile?.hasGeminiKey ? "Update Gemini API key" : "Set Gemini API key"}
          </button>

          <label className="profile-dropdown-toggle" role="menuitemcheckbox">
            <span>
              Keyboard study markers
              <span className="profile-dropdown-hint">← skip · → studied</span>
            </span>
            <input
              type="checkbox"
              checked={profile?.keyboardShortcutsEnabled ?? false}
              onChange={(e) => {
                void setKeyboardShortcutsEnabled(e.target.checked).catch(() => {});
              }}
            />
          </label>

          <button
            type="button"
            role="menuitem"
            className="profile-dropdown-item is-danger"
            onClick={() => void logout()}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
