import { sql } from "@/lib/db";
import { sortCategories, type CategoryRow } from "@/lib/category-types";

export type { CategoryRow } from "@/lib/category-types";
export { MAX_PINNED_CATEGORIES, sortCategories } from "@/lib/category-types";

export async function getCategoriesForUser(userId: number): Promise<CategoryRow[]> {
  const rows = await sql`
    SELECT
      c.id,
      c.name,
      c.slug,
      COUNT(t.id)::int AS topic_count,
      COUNT(up.id) FILTER (WHERE up.status IN ('studied', 'correct'))::int AS studied_count,
      (upc.category_id IS NOT NULL) AS pinned,
      upc.pinned_at
    FROM categories c
    LEFT JOIN topics t ON t.category_id = c.id
    LEFT JOIN user_progress up
      ON up.topic_id = t.id AND up.user_id = ${userId}
    LEFT JOIN user_pinned_categories upc
      ON upc.category_id = c.id AND upc.user_id = ${userId}
    GROUP BY c.id, upc.category_id, upc.pinned_at
    ORDER BY
      CASE WHEN upc.category_id IS NOT NULL THEN 0 ELSE 1 END,
      upc.pinned_at DESC NULLS LAST,
      c.name
  `;

  return sortCategories(
    rows.map((row) => ({
      id: row.id as number,
      name: row.name as string,
      slug: row.slug as string,
      topic_count: row.topic_count as number,
      studied_count: row.studied_count as number,
      pinned: Boolean(row.pinned),
      pinned_at: row.pinned_at ? String(row.pinned_at) : null,
    }))
  );
}
