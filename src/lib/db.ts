import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = neon(process.env.DATABASE_URL);

export type User = {
  id: number;
  username: string;
  password_hash: string;
  allow: boolean;
  is_system_admin?: boolean;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  topic_count?: number;
};

export type Topic = {
  id: number;
  category_id: number;
  title: string;
  description: string;
  section: string | null;
  sort_order: number;
  status?: string | null;
};

export type ProgressStatus = "studied" | "skipped" | "correct" | "failed";
