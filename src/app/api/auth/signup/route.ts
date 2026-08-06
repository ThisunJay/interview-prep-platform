import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sql } from "@/lib/db";

const schema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(32)
      .regex(/^[a-zA-Z0-9_]+$/, "Username: letters, numbers, underscore only"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;
    const existing = await sql`
      SELECT id FROM users WHERE lower(username) = lower(${username})
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await sql`
      INSERT INTO users (username, password_hash, allow)
      VALUES (${username}, ${passwordHash}, false)
      RETURNING id, username, allow
    `;

    return NextResponse.json({
      ok: true,
      message:
        "Account created. An admin must set allow=true before you can sign in.",
      user: { id: user.id, username: user.username, allow: user.allow },
    });
  } catch (err) {
    console.error("signup error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
