import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";
import { sanitizeText } from "@/lib/parse-md";

type Ctx = { params: Promise<{ id: string }> };

function mapTopic(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    categoryId: Number(row.category_id),
    categoryName: String(row.category_name),
    categorySlug: String(row.category_slug),
    title: String(row.title),
    section: row.section == null ? null : String(row.section),
    sortOrder: Number(row.sort_order ?? 0),
    description: String(row.description ?? ""),
    missingGuide:
      !String(row.description ?? "").trim() ||
      String(row.description).includes("_No guide"),
  };
}

export async function GET(_request: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;
  const topicId = Number(id);
  if (!Number.isFinite(topicId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const rows = await sql`
    SELECT
      t.id,
      t.category_id,
      t.title,
      t.section,
      t.sort_order,
      t.description,
      c.name AS category_name,
      c.slug AS category_slug
    FROM topics t
    JOIN categories c ON c.id = t.category_id
    WHERE t.id = ${topicId}
    LIMIT 1
  `;

  if (!rows.length) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  return NextResponse.json({ topic: mapTopic(rows[0] as Record<string, unknown>) });
}

const patchSchema = z.object({
  title: z.string().trim().min(1).max(300),
  section: z.string().trim().max(200).nullable(),
  sortOrder: z.number().int().min(0).max(100000),
  description: z.string().max(200_000),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;
  const topicId = Number(id);
  if (!Number.isFinite(topicId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const title = sanitizeText(body.title.trim());
  const section =
    body.section == null || body.section.trim() === ""
      ? null
      : sanitizeText(body.section.trim());
  const description = sanitizeText(body.description);

  try {
    const updated = await sql`
      UPDATE topics
      SET
        title = ${title},
        section = ${section},
        sort_order = ${body.sortOrder},
        description = ${description}
      WHERE id = ${topicId}
      RETURNING id
    `;

    if (!updated.length) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    if (message.toLowerCase().includes("unique")) {
      return NextResponse.json(
        { error: "A topic with that title already exists in this category" },
        { status: 409 }
      );
    }
    console.error("admin topic patch", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  const rows = await sql`
    SELECT
      t.id,
      t.category_id,
      t.title,
      t.section,
      t.sort_order,
      t.description,
      c.name AS category_name,
      c.slug AS category_slug
    FROM topics t
    JOIN categories c ON c.id = t.category_id
    WHERE t.id = ${topicId}
    LIMIT 1
  `;

  return NextResponse.json({
    ok: true,
    topic: mapTopic(rows[0] as Record<string, unknown>),
  });
}
