import type { UIMessage } from "ai";

/** How many recent messages to send to the model (≈ 5 exchanges). */
export const STUDY_BUDDY_RECENT_MESSAGE_LIMIT = 10;

/** Soft cap for persisted UI history per topic. */
export const STUDY_BUDDY_MAX_STORED_MESSAGES = 80;

const STORAGE_PREFIX = "prep.studyBuddy.v1.";
const MAX_SUMMARY_CHARS = 1800;
const MAX_SNIPPET_CHARS = 220;

export type StudyBuddyStoredChat = {
  version: 1;
  category: string;
  messages: UIMessage[];
  summary: string | null;
  updatedAt: string;
};

export function studyBuddyStorageKey(category: string): string {
  return STORAGE_PREFIX + slugifyTopic(category);
}

export function slugifyTopic(category: string): string {
  return category
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "topic";
}

function messagePlainText(message: UIMessage): string {
  if (!message.parts?.length) return "";
  return message.parts
    .filter((p) => p.type === "text" && "text" in p && p.text)
    .map((p) => (p as { text: string }).text)
    .join("")
    .trim();
}

/** Build a compact local digest of older turns (no extra LLM call). */
export function buildConversationSummary(
  olderMessages: UIMessage[],
  previousSummary?: string | null
): string | null {
  if (!olderMessages.length && !previousSummary?.trim()) return null;

  const lines: string[] = [];
  if (previousSummary?.trim()) {
    lines.push(`Prior notes: ${trimText(previousSummary.trim(), 600)}`);
  }

  for (const message of olderMessages) {
    const text = messagePlainText(message);
    if (!text) continue;
    const role = message.role === "user" ? "User" : "Interviewer";
    lines.push(`${role}: ${trimText(text, MAX_SNIPPET_CHARS)}`);
  }

  if (!lines.length) return null;
  return trimText(lines.join("\n"), MAX_SUMMARY_CHARS);
}

/**
 * Split full UI history into: recent window for the model + summary of the rest.
 */
export function selectContextForModel(
  messages: UIMessage[],
  previousSummary?: string | null,
  recentLimit = STUDY_BUDDY_RECENT_MESSAGE_LIMIT
): { recentMessages: UIMessage[]; summary: string | null } {
  if (messages.length <= recentLimit) {
    return {
      recentMessages: messages,
      summary: previousSummary?.trim()
        ? trimText(previousSummary.trim(), MAX_SUMMARY_CHARS)
        : null,
    };
  }

  const older = messages.slice(0, -recentLimit);
  let recent = messages.slice(-recentLimit);

  // Prefer starting the window on a user turn so roles stay paired.
  const firstUserIdx = recent.findIndex((m) => m.role === "user");
  if (firstUserIdx > 0) {
    older.push(...recent.slice(0, firstUserIdx));
    recent = recent.slice(firstUserIdx);
  }

  const summary = buildConversationSummary(older, previousSummary);
  return { recentMessages: recent, summary };
}

export function loadStudyBuddyChat(category: string): StudyBuddyStoredChat | null {
  if (typeof window === "undefined") return null;
  const key = studyBuddyStorageKey(category);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudyBuddyStoredChat;
    if (parsed?.version !== 1 || !Array.isArray(parsed.messages)) return null;
    return {
      version: 1,
      category: parsed.category || category,
      messages: parsed.messages.slice(-STUDY_BUDDY_MAX_STORED_MESSAGES),
      summary:
        typeof parsed.summary === "string" && parsed.summary.trim()
          ? trimText(parsed.summary.trim(), MAX_SUMMARY_CHARS)
          : null,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveStudyBuddyChat(
  category: string,
  messages: UIMessage[],
  previousSummary?: string | null
): StudyBuddyStoredChat {
  const trimmedMessages = messages.slice(-STUDY_BUDDY_MAX_STORED_MESSAGES);
  const { summary } = selectContextForModel(
    trimmedMessages,
    previousSummary ?? null
  );

  const payload: StudyBuddyStoredChat = {
    version: 1,
    category,
    messages: trimmedMessages,
    summary,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        studyBuddyStorageKey(category),
        JSON.stringify(payload)
      );
    } catch {
      // Quota / private mode — ignore
    }
  }

  return payload;
}

export function clearStudyBuddyChat(category: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(studyBuddyStorageKey(category));
  } catch {
    // ignore
  }
}

/** Server-safe trim of inbound request bodies. */
export function trimMessagesForModel(
  messages: UIMessage[],
  summary?: string | null,
  recentLimit = STUDY_BUDDY_RECENT_MESSAGE_LIMIT
): { recentMessages: UIMessage[]; summary: string | null } {
  return selectContextForModel(messages, summary, recentLimit);
}

function trimText(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}
