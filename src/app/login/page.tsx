import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="app-shell justify-center">
      <div className="fade-up mb-8">
        <h1 className="brand">
          Prep<span>.</span>
        </h1>
        <p className="mt-3 max-w-[20rem] text-[var(--muted)]">
          Mobile-first interview cards from your topic guides.
        </p>
      </div>
      <div className="panel fade-up p-5" style={{ animationDelay: "100ms" }}>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl">
          Sign in
        </h2>
        <LoginForm />
      </div>
    </main>
  );
}
