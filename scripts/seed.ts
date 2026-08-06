import fs from "fs";
import path from "path";
import { Client } from "pg";
import { parseAllContent } from "../src/lib/parse-md";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(process.cwd(), file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

async function main() {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log("Applying schema...");
  const schemaPath = path.join(process.cwd(), "scripts", "schema.sql");
  await client.query(fs.readFileSync(schemaPath, "utf8"));

  const contentDir = path.join(process.cwd(), "content");
  const categories = parseAllContent(contentDir);
  console.log(`Found ${categories.length} categories`);

  for (const category of categories) {
    const withDesc = category.topics.filter(
      (t) => !t.description.startsWith("_No guide")
    ).length;
    console.log(
      `  → ${category.name}: ${category.topics.length} topics (${withDesc} with guides)`
    );

    const catRes = await client.query<{ id: number }>(
      `INSERT INTO categories (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [category.name, category.slug]
    );
    const categoryId = catRes.rows[0].id;

    // Multi-row upsert in chunks
    const CHUNK = 40;
    for (let i = 0; i < category.topics.length; i += CHUNK) {
      const chunk = category.topics.slice(i, i + CHUNK);
      const values: unknown[] = [];
      const placeholders: string[] = [];

      chunk.forEach((topic, idx) => {
        const base = idx * 5;
        placeholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`
        );
        values.push(
          categoryId,
          topic.title,
          topic.description,
          topic.section,
          topic.sortOrder
        );
      });

      await client.query(
        `INSERT INTO topics (category_id, title, description, section, sort_order)
         VALUES ${placeholders.join(", ")}
         ON CONFLICT (category_id, title) DO UPDATE SET
           description = EXCLUDED.description,
           section = EXCLUDED.section,
           sort_order = EXCLUDED.sort_order`,
        values
      );
    }
  }

  const countRes = await client.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM topics`
  );
  console.log(`\nDone. ${countRes.rows[0].count} topics in database.`);
  await client.end();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
