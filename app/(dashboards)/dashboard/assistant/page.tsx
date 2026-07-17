"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiChat01Icon,
  CheckmarkCircle02Icon,
  Message01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";

type QuickReply = {
  label: string;
  action: "due" | "confirm";
};

type ChatMessage = {
  id: number;
  sender: "user" | "bot";
  content: string;
  quickReplies?: QuickReply[];
};

const dueOptions: QuickReply[] = [
  { label: "Handout Fee - ₦1,500", action: "due" },
  { label: "Association Due - ₦2,000", action: "due" },
];

const starterMessage: ChatMessage = {
  id: 1,
  sender: "bot",
  content:
    "Hi! I'm Duevy Assistant. I can help you pay dues, join a department, or check what you owe.",
};

const exampleQuestions = [
  "How much do I owe?",
  "I want to pay my handout fee",
  "Show my payment history",
  "Add me to 2CS4-DEPT",
];

/**
 * A UI-only assistant. It deliberately keeps all state in memory, so it can
 * be dropped in without backend configuration.
 */
export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageId = useRef(2);

  const showExamples = messages.length === 1 && !isTyping;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function nextMessage(
    sender: ChatMessage["sender"],
    content: string,
    quickReplies?: QuickReply[],
  ) {
    return { id: messageId.current++, sender, content, quickReplies };
  }

  function addBotReply(content: string, quickReplies?: QuickReply[]) {
    setIsTyping(true);
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        nextMessage("bot", content, quickReplies),
      ]);
      setIsTyping(false);
    }, 600);
  }

  function respondTo(text: string) {
    const normalized = text.toLowerCase();
    const hasJoinCode = /\b[a-z0-9]{4,}-[a-z0-9]{4,}\b/i.test(text);

    if (normalized.includes("pay")) {
      addBotReply("Sure — which due would you like to pay?", dueOptions);
    } else if (normalized.includes("add me") || hasJoinCode) {
      addBotReply("You've joined Dummy Dept Space ✅");
    } else if (normalized.includes("owe") || normalized.includes("balance")) {
      addBotReply("You owe ₦3,500 across 2 items.");
    } else if (normalized.includes("history")) {
      addBotReply(
        "Here's your recent payment history:\n• Faculty Levy — ₦1,000 · 12 Jun 2026\n• Departmental Dues — ₦2,500 · 04 May 2026\n• SUG Due — ₦1,500 · 19 Mar 2026",
      );
    } else {
      addBotReply(
        "I can help you pay dues, join a department, or check your balance. Try one of those!",
      );
    }
  }

  function sendMessage(text = input) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setMessages((current) => [...current, nextMessage("user", trimmed)]);
    setInput("");
    respondTo(trimmed);
  }

  function handleQuickReply(reply: QuickReply) {
    if (isTyping) return;
    setMessages((current) =>
      current.map((message) =>
        message.quickReplies ? { ...message, quickReplies: undefined } : message,
      ),
    );

    if (reply.action === "due") {
      setMessages((current) => [...current, nextMessage("user", reply.label)]);
      addBotReply(
        `Great choice. ${reply.label} is ready for payment. Would you like to continue?`,
        [{ label: "Confirm payment", action: "confirm" }],
      );
      return;
    }

    setMessages((current) => [...current, nextMessage("user", reply.label)]);
    addBotReply(
      "Payment confirmed! 🎉 In a live dashboard, I'd now take you to the secure payment page.",
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col lg:h-[calc(100vh-6rem)]">
      {/* Heading */}
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand text-white">
          <HugeiconsIcon icon={AiChat01Icon} size={22} />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Duevy Assistant
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            Here to make dues simple — ask about payments, balances, or joining a
            department.
          </p>
        </div>
      </header>

      {/* Chat panel */}
      <section
        aria-label="Duevy Assistant chat"
        className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-cloud bg-canvas shadow-sm"
      >
        <div className="flex-1 space-y-4 overflow-y-auto bg-paper/45 px-4 py-5 sm:px-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.sender === "user"
                  ? "flex justify-end"
                  : "flex justify-start gap-2.5"
              }
            >
              {message.sender === "bot" && (
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                  <HugeiconsIcon icon={Message01Icon} size={16} />
                </span>
              )}
              <div
                className={
                  message.sender === "user"
                    ? "max-w-[80%] rounded-2xl rounded-br-md bg-brand px-4 py-3 text-sm leading-6 text-white shadow-sm"
                    : "max-w-[80%]"
                }
              >
                <p
                  className={
                    message.sender === "bot"
                      ? "whitespace-pre-line rounded-2xl rounded-tl-md border border-cloud/70 bg-canvas px-4 py-3 text-sm leading-6 text-ink shadow-sm"
                      : "whitespace-pre-line"
                  }
                >
                  {message.content}
                </p>
                {message.quickReplies && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {message.quickReplies.map((reply) => (
                      <button
                        key={reply.label}
                        type="button"
                        onClick={() => handleQuickReply(reply)}
                        className="inline-flex items-center rounded-full border border-brand/25 bg-brand/5 px-3.5 py-1.5 text-xs font-semibold text-brand transition-colors duration-300 hover:bg-brand hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-pointer"
                      >
                        {reply.action === "confirm" && (
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            size={14}
                            className="mr-1"
                          />
                        )}
                        {reply.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand/10 text-brand">
                <HugeiconsIcon icon={Message01Icon} size={16} />
              </span>
              <div className="flex gap-1 rounded-2xl rounded-tl-md border border-cloud/70 bg-canvas px-4 py-3.5">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand/60"
                    style={{ animationDelay: `${dot * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Example prompts — shown until the visitor sends their first message. */}
          {showExamples && (
            <div className="pl-[42px]">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                Try asking
              </p>
              <div className="flex flex-wrap gap-2">
                {exampleQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => sendMessage(question)}
                    className="rounded-full border border-cloud bg-canvas px-3.5 py-1.5 text-xs font-medium text-ink-soft transition-colors duration-300 hover:border-brand/40 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-pointer"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-3 border-t border-cloud bg-canvas p-4"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about your dues..."
            aria-label="Message Duevy Assistant"
            className="min-w-0 flex-1 rounded-xl border border-cloud bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors duration-300 placeholder:text-ink-soft/70 focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-white transition-colors duration-300 hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-pointer"
          >
            <HugeiconsIcon icon={SentIcon} size={18} />
          </button>
        </form>
      </section>
    </div>
  );
}
