import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { encryptSecret } from "@/lib/secret-crypto";
import { getSession } from "@/lib/session";

const putSchema = z.object({
  apiKey: z.string().min(20).max(512),
});

function isValidGeminiApiKey(apiKey: string) {
  // Legacy Standard keys (AIza…) and newer AI Studio Auth keys (AQ.…)
  if (/\s/.test(apiKey)) return false;
  return apiKey.startsWith("AIza") || apiKey.startsWith("AQ.");
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof putSchema>;
  try {
    body = putSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid API key" }, { status: 400 });
  }

  const apiKey = body.apiKey.trim();
  if (!isValidGeminiApiKey(apiKey)) {
    return NextResponse.json(
      {
        error:
          "Invalid Gemini API key format. Expected a key starting with AIza… or AQ.…",
      },
      { status: 400 }
    );
  }

  const encrypted = encryptSecret(apiKey);
  await sql`
    UPDATE users
    SET gemini_api_key_encrypted = ${encrypted}
    WHERE id = ${session.userId}
  `;

  return NextResponse.json({ ok: true, hasGeminiKey: true });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sql`
    UPDATE users
    SET gemini_api_key_encrypted = NULL
    WHERE id = ${session.userId}
  `;

  return NextResponse.json({ ok: true, hasGeminiKey: false });
}
