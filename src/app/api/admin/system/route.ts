import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  let dbOk = false;
  let dbError: string | null = null;
  try {
    await sql`SELECT 1`;
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Database unreachable";
  }

  const env = {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasSessionSecret: Boolean(process.env.SESSION_SECRET),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  };

  return NextResponse.json({
    dbOk,
    dbError,
    env,
    studyBuddyModel: "gemini-3.6-flash",
    adminUsername: admin.username,
  });
}
