"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
    >
      Sign out
    </button>
  );
}
