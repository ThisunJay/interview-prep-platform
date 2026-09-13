import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT
      username,
      (gemini_api_key_encrypted IS NOT NULL AND gemini_api_key_encrypted <> '') AS has_gemini_key,
      COALESCE(keyboard_shortcuts_enabled, FALSE) AS keyboard_shortcuts_enabled
    FROM users
    WHERE id = ${session.userId}
    LIMIT 1
  `;

  if (!rows.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const row = rows[0];
  return NextResponse.json({
    username: String(row.username ?? session.username),
    hasGeminiKey: Boolean(row.has_gemini_key),
    keyboardShortcutsEnabled: Boolean(row.keyboard_shortcuts_enabled),
  });
}

const patchSchema = z.object({
  keyboardShortcutsEnabled: z.boolean(),
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await sql`
    UPDATE users
    SET keyboard_shortcuts_enabled = ${body.keyboardShortcutsEnabled}
    WHERE id = ${session.userId}
  `;

  return NextResponse.json({
    ok: true,
    keyboardShortcutsEnabled: body.keyboardShortcutsEnabled,
  });
}
