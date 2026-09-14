import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") ?? "all"; // all | pending | allowed
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const like = q ? `%${q}%` : "%";

  let rows;
  if (filter === "pending") {
    rows = await sql`
      SELECT
        u.id,
        u.username,
        u.allow,
        COALESCE(u.is_system_admin, FALSE) AS is_system_admin,
        u.created_at,
        (u.gemini_api_key_encrypted IS NOT NULL AND u.gemini_api_key_encrypted <> '') AS has_gemini_key,
        COALESCE(u.keyboard_shortcuts_enabled, FALSE) AS keyboard_shortcuts_enabled,
        (
          SELECT COUNT(*)::int FROM user_progress up
          WHERE up.user_id = u.id AND up.status IN ('studied', 'correct')
        ) AS studied_count,
        (
          SELECT COUNT(*)::int FROM drill_sessions ds WHERE ds.user_id = u.id
        ) AS drill_count
      FROM users u
      WHERE u.allow = FALSE
        AND lower(u.username) LIKE ${like}
      ORDER BY u.created_at DESC
      LIMIT 200
    `;
  } else if (filter === "allowed") {
    rows = await sql`
      SELECT
        u.id,
        u.username,
        u.allow,
        COALESCE(u.is_system_admin, FALSE) AS is_system_admin,
        u.created_at,
        (u.gemini_api_key_encrypted IS NOT NULL AND u.gemini_api_key_encrypted <> '') AS has_gemini_key,
        COALESCE(u.keyboard_shortcuts_enabled, FALSE) AS keyboard_shortcuts_enabled,
        (
          SELECT COUNT(*)::int FROM user_progress up
          WHERE up.user_id = u.id AND up.status IN ('studied', 'correct')
        ) AS studied_count,
        (
          SELECT COUNT(*)::int FROM drill_sessions ds WHERE ds.user_id = u.id
        ) AS drill_count
      FROM users u
      WHERE u.allow = TRUE
        AND lower(u.username) LIKE ${like}
      ORDER BY u.created_at DESC
      LIMIT 200
    `;
  } else {
    rows = await sql`
      SELECT
        u.id,
        u.username,
        u.allow,
        COALESCE(u.is_system_admin, FALSE) AS is_system_admin,
        u.created_at,
        (u.gemini_api_key_encrypted IS NOT NULL AND u.gemini_api_key_encrypted <> '') AS has_gemini_key,
        COALESCE(u.keyboard_shortcuts_enabled, FALSE) AS keyboard_shortcuts_enabled,
        (
          SELECT COUNT(*)::int FROM user_progress up
          WHERE up.user_id = u.id AND up.status IN ('studied', 'correct')
        ) AS studied_count,
        (
          SELECT COUNT(*)::int FROM drill_sessions ds WHERE ds.user_id = u.id
        ) AS drill_count
      FROM users u
      WHERE lower(u.username) LIKE ${like}
      ORDER BY
        CASE WHEN u.allow = FALSE THEN 0 ELSE 1 END,
        u.created_at DESC
      LIMIT 200
    `;
  }

  return NextResponse.json({
    users: rows.map((row) => ({
      id: Number(row.id),
      username: String(row.username),
      allow: Boolean(row.allow),
      isSystemAdmin: Boolean(row.is_system_admin),
      createdAt: row.created_at,
      hasGeminiKey: Boolean(row.has_gemini_key),
      keyboardShortcutsEnabled: Boolean(row.keyboard_shortcuts_enabled),
      studiedCount: Number(row.studied_count ?? 0),
      drillCount: Number(row.drill_count ?? 0),
    })),
  });
}
