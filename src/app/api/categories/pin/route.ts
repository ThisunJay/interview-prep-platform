import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { MAX_PINNED_CATEGORIES } from "@/lib/category-types";
import { getSession } from "@/lib/session";

const bodySchema = z.object({
  categoryId: z.number().int().positive(),
  pinned: z.boolean(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const category = await sql`
    SELECT id FROM categories WHERE id = ${body.categoryId}
  `;
  if (category.length === 0) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (body.pinned) {
    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count
      FROM user_pinned_categories
      WHERE user_id = ${session.userId}
    `;

    const alreadyPinned = await sql`
      SELECT 1 FROM user_pinned_categories
      WHERE user_id = ${session.userId} AND category_id = ${body.categoryId}
    `;

    if (alreadyPinned.length === 0 && (count as number) >= MAX_PINNED_CATEGORIES) {
      return NextResponse.json(
        { error: `You can pin at most ${MAX_PINNED_CATEGORIES} categories` },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO user_pinned_categories (user_id, category_id)
      VALUES (${session.userId}, ${body.categoryId})
      ON CONFLICT (user_id, category_id) DO UPDATE
      SET pinned_at = NOW()
    `;
  } else {
    await sql`
      DELETE FROM user_pinned_categories
      WHERE user_id = ${session.userId} AND category_id = ${body.categoryId}
    `;
  }

  return NextResponse.json({ ok: true, pinned: body.pinned });
}
