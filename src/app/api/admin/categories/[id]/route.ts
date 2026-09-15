import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;
  const categoryId = Number(id);
  if (!Number.isFinite(categoryId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const categories = await sql`
    SELECT id, name, slug, created_at
    FROM categories
    WHERE id = ${categoryId}
    LIMIT 1
  `;

  if (!categories.length) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const category = categories[0];

  const topics = await sql`
    SELECT
      t.id,
      t.title,
      t.section,
      t.sort_order,
      length(t.description)::int AS description_length,
      (t.description ILIKE '%_No guide%' OR trim(t.description) = '') AS missing_guide,
      left(t.description, 160) AS description_preview,
      COUNT(up.id) FILTER (WHERE up.status IN ('studied', 'correct'))::int AS studied_count,
      COUNT(up.id) FILTER (WHERE up.status = 'skipped')::int AS skipped_count,
      COUNT(up.id) FILTER (WHERE up.status = 'failed')::int AS failed_count
    FROM topics t
    LEFT JOIN user_progress up ON up.topic_id = t.id
    WHERE t.category_id = ${categoryId}
    GROUP BY t.id, t.title, t.section, t.sort_order, t.description
    ORDER BY t.sort_order ASC, t.title ASC
  `;

  return NextResponse.json({
    category: {
      id: Number(category.id),
      name: String(category.name),
      slug: String(category.slug),
      createdAt: category.created_at,
    },
    topics: topics.map((row) => ({
      id: Number(row.id),
      title: String(row.title),
      section: row.section == null ? null : String(row.section),
      sortOrder: Number(row.sort_order ?? 0),
      descriptionLength: Number(row.description_length ?? 0),
      missingGuide: Boolean(row.missing_guide),
      descriptionPreview: String(row.description_preview ?? ""),
      studiedCount: Number(row.studied_count ?? 0),
      skippedCount: Number(row.skipped_count ?? 0),
      failedCount: Number(row.failed_count ?? 0),
    })),
  });
}
