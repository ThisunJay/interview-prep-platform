import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <main className="app-shell justify-center">
      <div className="fade-up mb-8">
        <h1 className="brand">
          Prep<span>.</span>
        </h1>
        <p className="mt-3 max-w-[22rem] text-[var(--muted)]">
          Create an account. Access stays blocked until{" "}
          <code className="text-[var(--accent)]">allow</code> is set to true in
          the database.
        </p>
      </div>
      <div className="panel fade-up p-5" style={{ animationDelay: "100ms" }}>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl">
          Sign up
        </h2>
        <SignupForm />
      </div>
    </main>
  );
}
