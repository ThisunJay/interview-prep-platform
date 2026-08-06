import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sql } from "@/lib/db";
import { createSession } from "@/lib/session";

const schema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const { username, password } = parsed.data;
    const rows = await sql`
      SELECT id, username, password_hash, allow
      FROM users
      WHERE lower(username) = lower(${username})
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash as string);
    if (!valid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    if (!user.allow) {
      return NextResponse.json(
        {
          error:
            "Your account is pending approval. Ask an admin to set allow=true in the database.",
        },
        { status: 403 }
      );
    }

    await createSession({
      userId: user.id as number,
      username: user.username as string,
    });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
