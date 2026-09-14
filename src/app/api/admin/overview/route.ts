import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const [counts] = await sql`
    SELECT
      COUNT(*)::int AS total_users,
      COUNT(*) FILTER (WHERE allow = FALSE)::int AS pending_users,
      COUNT(*) FILTER (WHERE allow = TRUE)::int AS allowed_users,
      COUNT(*) FILTER (WHERE COALESCE(is_system_admin, FALSE) = TRUE)::int AS admin_users,
      COUNT(*) FILTER (
        WHERE gemini_api_key_encrypted IS NOT NULL AND gemini_api_key_encrypted <> ''
      )::int AS users_with_gemini
    FROM users
  `;

  const [content] = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM categories) AS categories,
      (SELECT COUNT(*)::int FROM topics) AS topics,
      (SELECT COUNT(*)::int FROM topics WHERE description ILIKE '%_No guide%') AS missing_guides
  `;

  const [activity] = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM user_progress) AS progress_rows,
      (SELECT COUNT(*)::int FROM drill_sessions) AS drill_sessions,
      (SELECT COUNT(*)::int FROM drill_sessions WHERE created_at > NOW() - INTERVAL '7 days') AS drills_7d,
      (SELECT COUNT(DISTINCT user_id)::int FROM user_progress WHERE updated_at > NOW() - INTERVAL '7 days') AS active_learners_7d
  `;

  return NextResponse.json({
    users: counts,
    content,
    activity,
  });
}
