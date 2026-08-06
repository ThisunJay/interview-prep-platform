import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

let drillTableReady: Promise<void> | null = null;

async function ensureDrillTable() {
  if (!drillTableReady) {
    drillTableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS drill_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          question_count INTEGER NOT NULL,
          correct_count INTEGER NOT NULL DEFAULT 0,
          missed_count INTEGER NOT NULL DEFAULT 0,
          accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_drills_user_recent
          ON drill_sessions(user_id, created_at DESC)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_drills_user_best
          ON drill_sessions(user_id, accuracy DESC, correct_count DESC)
      `;
    })().catch((err) => {
      drillTableReady = null;
      throw err;
    });
  }
  await drillTableReady;
}

const saveSchema = z.object({
  categoryId: z.number().int().positive(),
  questionCount: z.number().int().positive(),
  correctCount: z.number().int().min(0),
  missedCount: z.number().int().min(0),
});

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureDrillTable();

  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") === "best" ? "best" : "recent";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 10), 1), 10);

  const drills =
    sort === "best"
      ? await sql`
          SELECT
            d.id,
            d.category_id,
            c.name AS category_name,
            d.question_count,
            d.correct_count,
            d.missed_count,
            d.accuracy::float AS accuracy,
            d.created_at
          FROM drill_sessions d
          JOIN categories c ON c.id = d.category_id
          WHERE d.user_id = ${session.userId}
          ORDER BY d.accuracy DESC, d.correct_count DESC, d.created_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT
            d.id,
            d.category_id,
            c.name AS category_name,
            d.question_count,
            d.correct_count,
            d.missed_count,
            d.accuracy::float AS accuracy,
            d.created_at
          FROM drill_sessions d
          JOIN categories c ON c.id = d.category_id
          WHERE d.user_id = ${session.userId}
          ORDER BY d.created_at DESC
          LIMIT ${limit}
        `;

  return NextResponse.json({ drills });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureDrillTable();

  const body = await request.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { categoryId, questionCount, correctCount, missedCount } = parsed.data;
  const answered = correctCount + missedCount;
  const accuracy =
    answered > 0 ? Math.round((correctCount / answered) * 10000) / 100 : 0;

  const [drill] = await sql`
    INSERT INTO drill_sessions (
      user_id,
      category_id,
      question_count,
      correct_count,
      missed_count,
      accuracy
    )
    VALUES (
      ${session.userId},
      ${categoryId},
      ${questionCount},
      ${correctCount},
      ${missedCount},
      ${accuracy}
    )
    RETURNING
      id,
      category_id,
      question_count,
      correct_count,
      missed_count,
      accuracy::float AS accuracy,
      created_at
  `;

  return NextResponse.json({ ok: true, drill });
}
