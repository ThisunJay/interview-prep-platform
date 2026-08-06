import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const filter = searchParams.get("filter") ?? "all"; // all | unstudied

  if (!categoryId) {
    return NextResponse.json({ error: "categoryId required" }, { status: 400 });
  }

  const topics =
    filter === "unstudied"
      ? await sql`
          SELECT
            t.id,
            t.category_id,
            t.title,
            t.description,
            t.section,
            t.sort_order,
            up.status
          FROM topics t
          LEFT JOIN user_progress up
            ON up.topic_id = t.id AND up.user_id = ${session.userId}
          WHERE t.category_id = ${Number(categoryId)}
            AND (up.status IS NULL OR up.status IN ('skipped', 'failed'))
          ORDER BY t.sort_order
        `
      : await sql`
          SELECT
            t.id,
            t.category_id,
            t.title,
            t.description,
            t.section,
            t.sort_order,
            up.status
          FROM topics t
          LEFT JOIN user_progress up
            ON up.topic_id = t.id AND up.user_id = ${session.userId}
          WHERE t.category_id = ${Number(categoryId)}
          ORDER BY t.sort_order
        `;

  return NextResponse.json({ topics });
}
