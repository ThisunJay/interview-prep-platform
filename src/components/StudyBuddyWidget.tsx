"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useStudyBuddy } from "@/components/StudyBuddyProvider";
import { useUserProfile } from "@/components/UserProfileProvider";
import {
  clearStudyBuddyChat,
  loadStudyBuddyChat,
  saveStudyBuddyChat,
  selectContextForModel,
} from "@/lib/study-buddy-chat-storage";

function messageText(message: {
  parts?: Array<{ type: string; text?: string }>;
}): string {
  if (!message.parts?.length) return "";
  return message.parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text as string)
    .join("");
}

export function StudyBuddyWidget() {
  const pathname = usePathname();
  const { activeCategory, setActiveCategory, topicOptions } = useStudyBuddy();
  const { profile, loading: profileLoading, openGeminiModal } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [topicPickerOpen, setTopicPickerOpen] = useState(true);
  const [hydratedCategory, setHydratedCategory] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef(activeCategory);
  const summaryRef = useRef<string | null>(null);
  const latestByTopicRef = useRef(
    new Map<string, { messages: UIMessage[]; summary: string | null }>()
  );
  const prevCategoryRef = useRef(activeCategory);

  categoryRef.current = activeCategory;

  const hideOnAuth =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");
  const hideOnHome = pathname === "/";
  const hideOnAdmin = pathname.startsWith("/admin");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/study-buddy",
        prepareSendMessagesRequest: ({ messages, body, id, trigger, messageId }) => {
          const { recentMessages, summary } = selectContextForModel(
            messages as UIMessage[],
            summaryRef.current
          );
          summaryRef.current = summary;
          return {
            body: {
              ...(body ?? {}),
              id,
              trigger,
              messageId,
              category: categoryRef.current,
              conversationSummary: summary,
              messages: recentMessages,
            },
          };
        },
      }),
    []
  );

  const { messages, sendMessage, status, error, setMessages, stop, clearError } =
    useChat({
      id: `study-buddy-${activeCategory}`,
      transport,
    });

  const busy = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  if (hydratedCategory === activeCategory) {
    latestByTopicRef.current.set(activeCategory, {
      messages: messages as UIMessage[],
      summary: summaryRef.current,
    });
  }

  // Save previous topic, then hydrate the new one from localStorage.
  useEffect(() => {
    const prev = prevCategoryRef.current;
    if (prev !== activeCategory) {
      const cached = latestByTopicRef.current.get(prev);
      if (cached) {
        saveStudyBuddyChat(prev, cached.messages, cached.summary);
      }
      prevCategoryRef.current = activeCategory;
    }

    const stored = loadStudyBuddyChat(activeCategory);
    summaryRef.current = stored?.summary ?? null;
    setMessages(stored?.messages ?? []);
    setHydratedCategory(activeCategory);
    clearError();
    setLocalError(null);
  }, [activeCategory, setMessages, clearError]);

  // Persist full UI history (and rolling summary) after turns settle.
  useEffect(() => {
    if (hydratedCategory !== activeCategory) return;
    if (busy) return;
    const saved = saveStudyBuddyChat(
      activeCategory,
      messages as UIMessage[],
      summaryRef.current
    );
    summaryRef.current = saved.summary;
  }, [messages, busy, activeCategory, hydratedCategory]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open, busy]);

  useEffect(() => {
    if (hideOnHome || hideOnAuth || hideOnAdmin) setOpen(false);
  }, [hideOnHome, hideOnAuth, hideOnAdmin]);

  useEffect(() => {
    if (hasMessages) setTopicPickerOpen(false);
    else setTopicPickerOpen(true);
  }, [hasMessages]);

  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 136)}px`;
  }, [input]);

  if (hideOnAuth || hideOnHome || hideOnAdmin) return null;

  function onFabClick() {
    if (profileLoading) return;
    if (!profile?.hasGeminiKey) {
      openGeminiModal();
      return;
    }
    setOpen((v) => !v);
  }

  function clearChat() {
    clearStudyBuddyChat(activeCategory);
    summaryRef.current = null;
    latestByTopicRef.current.set(activeCategory, {
      messages: [],
      summary: null,
    });
    setMessages([]);
    clearError();
    setLocalError(null);
    setTopicPickerOpen(true);
  }

  function onComposerKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy && input.trim()) {
        e.currentTarget.form?.requestSubmit();
      }
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const text = input.trim();
    if (!text || busy) return;

    if (!profile?.hasGeminiKey) {
      setLocalError("Add a Gemini API key from your profile menu first.");
      openGeminiModal();
      return;
    }

    if (!activeCategory.trim()) {
      setLocalError("Pick an active study topic first.");
      return;
    }

    setInput("");
    setTopicPickerOpen(false);
    try {
      await sendMessage({ text });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to send");
    }
  }

  return (
    <>
      <button
        type="button"
        className="study-buddy-fab"
        aria-label={open ? "Close Study Buddy" : "Open Study Buddy"}
        aria-expanded={open}
        onClick={onFabClick}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7A2.5 2.5 0 0117.5 16H9l-4 3.5V6.5z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {open ? (
        <section
          className="study-buddy-panel"
          role="dialog"
          aria-label="Study Buddy chat"
        >
          <header className="study-buddy-header">
            <div>
              <p className="study-buddy-kicker">Study Buddy</p>
              <p className="study-buddy-topic" title={activeCategory}>
                {activeCategory}
              </p>
            </div>
            <div className="study-buddy-header-actions">
              <button
                type="button"
                className="study-buddy-icon-btn"
                onClick={clearChat}
                title="Clear chat"
              >
                Clear
              </button>
              <button
                type="button"
                className="study-buddy-icon-btn study-buddy-close-btn"
                onClick={() => setOpen(false)}
                aria-label="Close Study Buddy"
                title="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </header>

          <div
            className={`study-buddy-controls${
              hasMessages && !topicPickerOpen ? " is-collapsed" : ""
            }`}
          >
            {hasMessages && !topicPickerOpen ? (
              <button
                type="button"
                className="study-buddy-topic-toggle"
                onClick={() => setTopicPickerOpen(true)}
                aria-expanded={false}
              >
                <span>
                  <span className="study-buddy-label">Active topic</span>
                  <span className="study-buddy-topic-toggle-value">
                    {activeCategory}
                  </span>
                </span>
                <span className="study-buddy-topic-toggle-action">Change</span>
              </button>
            ) : (
              <>
                <div className="study-buddy-controls-head">
                  <label className="study-buddy-label" htmlFor="study-buddy-topic">
                    Active topic
                  </label>
                  {hasMessages ? (
                    <button
                      type="button"
                      className="study-buddy-topic-hide"
                      onClick={() => setTopicPickerOpen(false)}
                    >
                      Hide
                    </button>
                  ) : null}
                </div>
                <select
                  id="study-buddy-topic"
                  className="field"
                  value={activeCategory}
                  onChange={(e) => {
                    // Persist current topic before switching (effect also saves when idle).
                    if (!busy) {
                      saveStudyBuddyChat(
                        activeCategory,
                        messages as UIMessage[],
                        summaryRef.current
                      );
                    }
                    setActiveCategory(e.target.value);
                    clearError();
                    setTopicPickerOpen(true);
                  }}
                >
                  {!topicOptions.includes(activeCategory) ? (
                    <option value={activeCategory}>{activeCategory}</option>
                  ) : null}
                  {topicOptions.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div className="study-buddy-messages" ref={listRef}>
            {messages.length === 0 ? (
              <div className="study-buddy-empty">
                <p>
                  Locked to <strong>{activeCategory}</strong>. Ask for interview
                  questions, whiteboarding prompts, or critique your answer.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const text = messageText(m);
                if (!text) return null;
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`study-buddy-bubble ${
                      isUser ? "is-user" : "is-assistant"
                    }`}
                  >
                    <p className="study-buddy-role">
                      {isUser ? "You" : "Interviewer"}
                    </p>
                    {isUser ? (
                      <div className="study-buddy-text">{text}</div>
                    ) : (
                      <div className="study-buddy-md prose-prep">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {busy ? (
              <p className="study-buddy-status">Interviewer is thinking…</p>
            ) : null}
          </div>

          {(localError || error) && (
            <p className="study-buddy-error" role="alert">
              {localError ?? error?.message ?? "Something went wrong"}
            </p>
          )}

          <form className="study-buddy-form" onSubmit={onSubmit}>
            <textarea
              ref={composerRef}
              className="field study-buddy-composer"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onComposerKeyDown}
              placeholder={`Ask about ${activeCategory}…`}
              disabled={busy}
              aria-label="Message"
              rows={1}
            />
            {busy ? (
              <button
                type="button"
                className="btn-primary study-buddy-send"
                onClick={() => stop()}
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary study-buddy-send"
                disabled={!input.trim()}
              >
                Send
              </button>
            )}
          </form>
        </section>
      ) : null}
    </>
  );
}
