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
  const count = Math.min(
    Math.max(Number(searchParams.get("count") ?? 10), 1),
    100
  );

  if (!categoryId) {
    return NextResponse.json({ error: "categoryId required" }, { status: 400 });
  }

  const topics = await sql`
    SELECT
      t.id,
      t.category_id,
      t.title,
      t.description,
      t.section,
      t.sort_order
    FROM topics t
    WHERE t.category_id = ${Number(categoryId)}
      AND t.description IS NOT NULL
      AND t.description <> ''
      AND t.description NOT LIKE '_No guide%'
    ORDER BY RANDOM()
    LIMIT ${count}
  `;

  return NextResponse.json({ topics, count: topics.length });
}
