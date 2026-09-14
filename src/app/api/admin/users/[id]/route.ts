import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const users = await sql`
    SELECT
      id,
      username,
      allow,
      COALESCE(is_system_admin, FALSE) AS is_system_admin,
      created_at,
      (gemini_api_key_encrypted IS NOT NULL AND gemini_api_key_encrypted <> '') AS has_gemini_key,
      COALESCE(keyboard_shortcuts_enabled, FALSE) AS keyboard_shortcuts_enabled
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  if (!users.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = users[0];

  const byCategory = await sql`
    SELECT
      c.id,
      c.name,
      COUNT(t.id)::int AS topic_count,
      COUNT(up.id) FILTER (WHERE up.status IN ('studied', 'correct'))::int AS studied_count
    FROM categories c
    LEFT JOIN topics t ON t.category_id = c.id
    LEFT JOIN user_progress up
      ON up.topic_id = t.id AND up.user_id = ${userId}
    GROUP BY c.id, c.name
    ORDER BY c.name
  `;

  const recentDrills = await sql`
    SELECT
      ds.id,
      c.name AS category_name,
      ds.question_count,
      ds.correct_count,
      ds.missed_count,
      ds.accuracy,
      ds.created_at
    FROM drill_sessions ds
    JOIN categories c ON c.id = ds.category_id
    WHERE ds.user_id = ${userId}
    ORDER BY ds.created_at DESC
    LIMIT 10
  `;

  const pins = await sql`
    SELECT c.id, c.name, upc.pinned_at
    FROM user_pinned_categories upc
    JOIN categories c ON c.id = upc.category_id
    WHERE upc.user_id = ${userId}
    ORDER BY upc.pinned_at DESC
  `;

  return NextResponse.json({
    user: {
      id: Number(user.id),
      username: String(user.username),
      allow: Boolean(user.allow),
      isSystemAdmin: Boolean(user.is_system_admin),
      createdAt: user.created_at,
      hasGeminiKey: Boolean(user.has_gemini_key),
      keyboardShortcutsEnabled: Boolean(user.keyboard_shortcuts_enabled),
    },
    categories: byCategory.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      topicCount: Number(row.topic_count ?? 0),
      studiedCount: Number(row.studied_count ?? 0),
    })),
    recentDrills: recentDrills.map((row) => ({
      id: Number(row.id),
      categoryName: String(row.category_name),
      questionCount: Number(row.question_count),
      correctCount: Number(row.correct_count),
      missedCount: Number(row.missed_count),
      accuracy: Number(row.accuracy),
      createdAt: row.created_at,
    })),
    pins: pins.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      pinnedAt: row.pinned_at,
    })),
  });
}

const patchSchema = z.object({
  allow: z.boolean(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (userId === admin.userId && body.allow === false) {
    return NextResponse.json(
      { error: "You cannot revoke your own access" },
      { status: 400 }
    );
  }

  const updated = await sql`
    UPDATE users
    SET allow = ${body.allow}
    WHERE id = ${userId}
    RETURNING id, username, allow, COALESCE(is_system_admin, FALSE) AS is_system_admin
  `;

  if (!updated.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const row = updated[0];
  return NextResponse.json({
    ok: true,
    user: {
      id: Number(row.id),
      username: String(row.username),
      allow: Boolean(row.allow),
      isSystemAdmin: Boolean(row.is_system_admin),
    },
  });
}
