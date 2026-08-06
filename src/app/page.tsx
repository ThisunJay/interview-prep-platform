import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const categories = await sql`
    SELECT
      c.id,
      c.name,
      c.slug,
      COUNT(t.id)::int AS topic_count,
      COUNT(up.id) FILTER (WHERE up.status IN ('studied', 'correct'))::int AS studied_count
    FROM categories c
    LEFT JOIN topics t ON t.category_id = c.id
    LEFT JOIN user_progress up
      ON up.topic_id = t.id AND up.user_id = ${session.userId}
    GROUP BY c.id
    ORDER BY c.name
  `;

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
          <ul className="space-y-3">
            {categories.map((cat) => {
              const pct =
                cat.topic_count > 0
                  ? Math.round((cat.studied_count / cat.topic_count) * 100)
                  : 0;
              return (
                <li key={cat.id as number}>
                  <Link href={`/study/${cat.id}`} className="category-link">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-[family-name:var(--font-display)] text-lg font-medium">
                          {cat.name as string}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {cat.topic_count as number} topics · {pct}% studied
                        </p>
                      </div>
                      <span className="mt-1 text-[var(--accent)]">→</span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/30">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
