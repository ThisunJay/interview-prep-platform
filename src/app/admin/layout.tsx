import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await sql`
    SELECT COALESCE(is_system_admin, FALSE) AS is_system_admin, allow
    FROM users
    WHERE id = ${session.userId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row?.allow || !row.is_system_admin) {
    redirect("/");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <p className="admin-brand-kicker">Prep</p>
          <h1 className="admin-brand-title">Admin</h1>
          <p className="admin-brand-user">{session.username}</p>
        </div>
        <AdminNav />
        <Link href="/" className="admin-exit">
          ← Back to study
        </Link>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
