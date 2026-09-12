import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="app-shell items-center justify-center">
      <div className="auth-panel fade-up mb-8">
        <h1 className="brand">
          Prep<span>.</span>
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Interview cards from your topic guides — study on phone or desktop.
        </p>
      </div>
      <div
        className="auth-panel panel fade-up p-5"
        style={{ animationDelay: "100ms" }}
      >
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl">
          Sign in
        </h2>
        <LoginForm />
      </div>
    </main>
  );
}
