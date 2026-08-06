import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({ categories });
}
