import Link from "next/link";
import { redirect } from "next/navigation";
import { CategoryList } from "@/components/CategoryList";
import { LogoutButton } from "@/components/LogoutButton";
import { getCategoriesForUser } from "@/lib/categories";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const categories = await getCategoriesForUser(session.userId);

  return (
    <main className="app-shell">
      <header className="fade-up mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Interview prep
          </p>
          <h1 className="brand">
            Prep<span>.</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Hi {session.username} — pick a category to study.
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="fade-up space-y-3" style={{ animationDelay: "80ms" }}>
        <div className="mb-1 flex items-end justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
            Categories
          </h2>
          <Link
            href="/random"
            className="text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Random drill →
          </Link>
        </div>

        {categories.length === 0 ? (
          <div className="panel p-5 text-sm text-[var(--muted)]">
            No categories yet. Run{" "}
            <code className="text-[var(--accent)]">npm run seed</code> to import
            the markdown files.
          </div>
        ) : (
          <CategoryList initialCategories={categories} />
        )}
      </section>
    </main>
  );
}
