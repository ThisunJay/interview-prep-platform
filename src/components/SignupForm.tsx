"use client";

import { useState } from "react";
import Link from "next/link";

export function SignupForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Signup failed");
        return;
      }
      setSuccess(
        data.message ??
          "Account created. Wait for approval (allow=true) before signing in."
      );
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="auth-form space-y-4">
      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm text-[var(--muted)]">
          Username
        </label>
        <input
          id="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="field"
          required
          minLength={3}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm text-[var(--muted)]">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
          required
          minLength={6}
        />
      </div>
      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1.5 block text-sm text-[var(--muted)]"
        >
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="field"
          required
        />
      </div>
      {error && (
        <p className="rounded-lg bg-[var(--skipped-soft)] px-3 py-2 text-sm text-[var(--skipped)]">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-[var(--studied-soft)] px-3 py-2 text-sm text-[var(--studied)]">
          {success}
        </p>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Creating…" : "Create account"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--accent)] underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
