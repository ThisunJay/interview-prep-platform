import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { sql } from "@/lib/db";
import { decryptSecret } from "@/lib/secret-crypto";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;

function buildSystemPrompt(topic: string) {
  return `You are an elite technical interviewer. The current focus topic is ${topic}. You must strictly refuse to answer any questions or hold discussions outside of ${topic}. If the user shifts topics, gently but firmly redirect them back to the core topic. Conduct a sharp, realistic behavioral or technical interview prep deep-dive.

Guidelines:
- Prefer probing follow-up questions over long lectures.
- Use realistic interview phrasing and scenarios tied to ${topic}.
- When explaining, keep answers structured and interview-ready (definition → why it matters → how it works → tradeoffs).
- If the user asks for something unrelated to ${topic}, decline briefly and steer them back.
- Do not reveal or invent API keys, secrets, or credentials.`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT gemini_api_key_encrypted
    FROM users
    WHERE id = ${session.userId}
    LIMIT 1
  `;

  const encrypted = rows[0]?.gemini_api_key_encrypted as string | null | undefined;
  if (!encrypted) {
    return Response.json(
      {
        error:
          "No Gemini API key on your profile. Open the profile menu to add one.",
        code: "MISSING_API_KEY",
      },
      { status: 401 }
    );
  }

  let apiKey: string;
  try {
    apiKey = decryptSecret(encrypted);
  } catch {
    return Response.json(
      { error: "Stored API key could not be decrypted. Please save it again." },
      { status: 500 }
    );
  }

  let body: { messages?: UIMessage[]; category?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const category = (body.category ?? "").trim();
  if (!category) {
    return Response.json(
      { error: "Active study category is required." },
      { status: 400 }
    );
  }

  const messages = body.messages ?? [];
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages are required" }, { status: 400 });
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const result = streamText({
      model: google("gemini-3.6-flash"),
      system: buildSystemPrompt(category),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("study-buddy error", err);
    const message =
      err instanceof Error ? err.message : "Failed to reach Gemini";
    return Response.json({ error: message }, { status: 502 });
  }
}
