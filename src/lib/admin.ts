import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession, type SessionPayload } from "@/lib/session";

export type AdminSession = SessionPayload & { isSystemAdmin: true };

/** Require an authenticated system admin. Returns session or a NextResponse error. */
export async function requireAdmin(): Promise<AdminSession | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT COALESCE(is_system_admin, FALSE) AS is_system_admin, allow
    FROM users
    WHERE id = ${session.userId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row || !row.allow) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!row.is_system_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { ...session, isSystemAdmin: true };
}

/** For server components / pages — redirects if not admin. */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("REDIRECT_LOGIN");
  }

  const rows = await sql`
    SELECT COALESCE(is_system_admin, FALSE) AS is_system_admin, allow
    FROM users
    WHERE id = ${session.userId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row?.allow || !row.is_system_admin) {
    throw new Error("REDIRECT_HOME");
  }

  return { ...session, isSystemAdmin: true };
}
