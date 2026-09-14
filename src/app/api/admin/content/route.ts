import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const categories = await sql`
    SELECT
      c.id,
      c.name,
      c.slug,
      c.created_at,
      COUNT(t.id)::int AS topic_count,
      COUNT(t.id) FILTER (
        WHERE t.description ILIKE '%_No guide%' OR t.description = ''
      )::int AS missing_guide_count,
      COUNT(DISTINCT up.user_id) FILTER (
        WHERE up.status IN ('studied', 'correct')
      )::int AS learners_studied
    FROM categories c
    LEFT JOIN topics t ON t.category_id = c.id
    LEFT JOIN user_progress up ON up.topic_id = t.id
    GROUP BY c.id, c.name, c.slug, c.created_at
    ORDER BY c.name
  `;

  const weakTopics = await sql`
    SELECT
      t.id,
      t.title,
      c.name AS category_name,
      COUNT(up.id) FILTER (WHERE up.status = 'skipped')::int AS skipped_count,
      COUNT(up.id) FILTER (WHERE up.status = 'failed')::int AS failed_count,
      COUNT(up.id) FILTER (WHERE up.status IN ('studied', 'correct'))::int AS studied_count,
      (t.description ILIKE '%_No guide%' OR t.description = '') AS missing_guide
    FROM topics t
    JOIN categories c ON c.id = t.category_id
    LEFT JOIN user_progress up ON up.topic_id = t.id
    GROUP BY t.id, t.title, c.name, t.description
    HAVING
      COUNT(up.id) FILTER (WHERE up.status IN ('skipped', 'failed')) > 0
      OR (t.description ILIKE '%_No guide%' OR t.description = '')
    ORDER BY
      (COUNT(up.id) FILTER (WHERE up.status IN ('skipped', 'failed'))) DESC,
      t.title
    LIMIT 40
  `;

  return NextResponse.json({
    categories: categories.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      slug: String(row.slug),
      createdAt: row.created_at,
      topicCount: Number(row.topic_count ?? 0),
      missingGuideCount: Number(row.missing_guide_count ?? 0),
      learnersStudied: Number(row.learners_studied ?? 0),
    })),
    weakTopics: weakTopics.map((row) => ({
      id: Number(row.id),
      title: String(row.title),
      categoryName: String(row.category_name),
      skippedCount: Number(row.skipped_count ?? 0),
      failedCount: Number(row.failed_count ?? 0),
      studiedCount: Number(row.studied_count ?? 0),
      missingGuide: Boolean(row.missing_guide),
    })),
  });
}
