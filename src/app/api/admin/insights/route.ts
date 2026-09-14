import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const categoryProgress = await sql`
    SELECT
      c.id,
      c.name,
      COUNT(DISTINCT t.id)::int AS topic_count,
      COUNT(DISTINCT up.user_id) FILTER (
        WHERE up.status IN ('studied', 'correct')
      )::int AS unique_learners,
      COUNT(up.id) FILTER (WHERE up.status IN ('studied', 'correct'))::int AS studied_marks,
      COUNT(up.id) FILTER (WHERE up.status = 'skipped')::int AS skipped_marks,
      COUNT(up.id) FILTER (WHERE up.status = 'failed')::int AS failed_marks,
      ROUND(AVG(ds.accuracy)::numeric, 1) AS avg_drill_accuracy
    FROM categories c
    LEFT JOIN topics t ON t.category_id = c.id
    LEFT JOIN user_progress up ON up.topic_id = t.id
    LEFT JOIN drill_sessions ds ON ds.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY studied_marks DESC, c.name
  `;

  const recentDrills = await sql`
    SELECT
      ds.id,
      u.username,
      c.name AS category_name,
      ds.question_count,
      ds.correct_count,
      ds.missed_count,
      ds.accuracy,
      ds.created_at
    FROM drill_sessions ds
    JOIN users u ON u.id = ds.user_id
    JOIN categories c ON c.id = ds.category_id
    ORDER BY ds.created_at DESC
    LIMIT 25
  `;

  const topLearners = await sql`
    SELECT
      u.id,
      u.username,
      COUNT(up.id) FILTER (WHERE up.status IN ('studied', 'correct'))::int AS studied_count,
      COUNT(DISTINCT ds.id)::int AS drill_count,
      ROUND(AVG(ds.accuracy)::numeric, 1) AS avg_accuracy
    FROM users u
    LEFT JOIN user_progress up ON up.user_id = u.id
    LEFT JOIN drill_sessions ds ON ds.user_id = u.id
    WHERE u.allow = TRUE
    GROUP BY u.id, u.username
    HAVING COUNT(up.id) FILTER (WHERE up.status IN ('studied', 'correct')) > 0
       OR COUNT(DISTINCT ds.id) > 0
    ORDER BY studied_count DESC, drill_count DESC
    LIMIT 20
  `;

  return NextResponse.json({
    categoryProgress: categoryProgress.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      topicCount: Number(row.topic_count ?? 0),
      uniqueLearners: Number(row.unique_learners ?? 0),
      studiedMarks: Number(row.studied_marks ?? 0),
      skippedMarks: Number(row.skipped_marks ?? 0),
      failedMarks: Number(row.failed_marks ?? 0),
      avgDrillAccuracy:
        row.avg_drill_accuracy == null ? null : Number(row.avg_drill_accuracy),
    })),
    recentDrills: recentDrills.map((row) => ({
      id: Number(row.id),
      username: String(row.username),
      categoryName: String(row.category_name),
      questionCount: Number(row.question_count),
      correctCount: Number(row.correct_count),
      missedCount: Number(row.missed_count),
      accuracy: Number(row.accuracy),
      createdAt: row.created_at,
    })),
    topLearners: topLearners.map((row) => ({
      id: Number(row.id),
      username: String(row.username),
      studiedCount: Number(row.studied_count ?? 0),
      drillCount: Number(row.drill_count ?? 0),
      avgAccuracy: row.avg_accuracy == null ? null : Number(row.avg_accuracy),
    })),
  });
}
