"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type UserProfile = {
  username: string;
  hasGeminiKey: boolean;
  keyboardShortcutsEnabled: boolean;
  isSystemAdmin: boolean;
};

type UserProfileContextValue = {
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  setKeyboardShortcutsEnabled: (enabled: boolean) => Promise<void>;
  geminiModalOpen: boolean;
  openGeminiModal: () => void;
  closeGeminiModal: () => void;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);

  const skipAuthPages =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");

  const refreshProfile = useCallback(async () => {
    if (skipAuthPages) {
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile", { credentials: "same-origin" });
      if (!res.ok) {
        setProfile(null);
        return;
      }
      const data = await res.json();
      const username =
        typeof data.username === "string" ? data.username.trim() : "";
      if (!username) {
        setProfile(null);
        return;
      }
      setProfile({
        username,
        hasGeminiKey: Boolean(data.hasGeminiKey),
        keyboardShortcutsEnabled: Boolean(data.keyboardShortcutsEnabled),
        isSystemAdmin: Boolean(data.isSystemAdmin),
      });
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [skipAuthPages]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const setKeyboardShortcutsEnabled = useCallback(async (enabled: boolean) => {
    setProfile((prev) =>
      prev ? { ...prev, keyboardShortcutsEnabled: enabled } : prev
    );
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyboardShortcutsEnabled: enabled }),
    });
    if (!res.ok) {
      await refreshProfile();
      throw new Error("Could not update keyboard shortcut preference");
    }
  }, [refreshProfile]);

  const value = useMemo(
    () => ({
      profile,
      loading,
      refreshProfile,
      setKeyboardShortcutsEnabled,
      geminiModalOpen,
      openGeminiModal: () => setGeminiModalOpen(true),
      closeGeminiModal: () => setGeminiModalOpen(false),
    }),
    [
      profile,
      loading,
      refreshProfile,
      setKeyboardShortcutsEnabled,
      geminiModalOpen,
    ]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return ctx;
}
