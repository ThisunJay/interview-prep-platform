import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

const schema = z.object({
  topicId: z.number().int().positive(),
  status: z.enum(["studied", "skipped", "correct", "failed"]),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { topicId, status } = parsed.data;

  await sql`
    INSERT INTO user_progress (user_id, topic_id, status, updated_at)
    VALUES (${session.userId}, ${topicId}, ${status}, NOW())
    ON CONFLICT (user_id, topic_id) DO UPDATE SET
      status = EXCLUDED.status,
      updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}
