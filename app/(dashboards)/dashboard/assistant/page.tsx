"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiChat01Icon,
  Message01Icon,
  SentIcon,
  Add01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import {
  sendAssistantMessage,
  confirmAssistantJoin,
  confirmAssistantCreateDue,
  listAssistantConversations,
  getAssistantConversationMessages,
  type AssistantAction,
  type AssistantQuickReply,
  type AssistantConversationSummary,
} from "@/lib/api/assistant";
import { Modal } from "../_components/Modal";
import { EmptyState } from "../_components/EmptyState";
import { getDue, payDue as payDueApi } from "@/lib/api/dues";
import { getSpace } from "@/lib/api/spaces";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { adaptDue, adaptSpace } from "../dues/_components/adapt";
import type { Due, Space } from "../dues/_components/types";
import { PayDueModal } from "../dues/_components/PayDueModal";
import { ReceiptModal } from "../dues/_components/ReceiptModal";
import { buildReceipts, type Receipt } from "../dues/_components/receipt";
import { naira } from "../_components/format";

type ChatMessage = {
  id: number;
  sender: "user" | "bot";
  content: string;
  quickReplies?: AssistantQuickReply[];
  action?: AssistantAction;
};

const starterMessage: ChatMessage = {
  id: 1,
  sender: "bot",
  content:
    "Hi! I'm Duey. I can help you pay dues, join a department, check your balance, view your payment history, or find your department rep.",
};

const exampleQuestions = [
  "How much do I owe?",
  "Pay my handout fee",
  "Show my payment history",
  "Who is my department rep?",
  "Join my department",
  "What dues do I have coming up?",
];

export default function AssistantPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageId = useRef(2);

  // Payment-modal state, populated when Duey resolves an `open_payment_modal` action.
  const [payDue, setPayDue] = useState<Due | null>(null);
  const [paySpace, setPaySpace] = useState<Space | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payPending, setPayPending] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  // Create-due confirm state (rep-only), keyed by the chat message offering it.
  const [creatingDueId, setCreatingDueId] = useState<number | null>(null);

  // Conversation history panel.
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<
    AssistantConversationSummary[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadingConversationId, setLoadingConversationId] = useState<
    string | null
  >(null);

  const showExamples = messages.length === 1 && !sending;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Restores the chat transcript when returning from the dedicated payment
  // page (?conversationId=... on the back link) — otherwise the conversation
  // would look reset even though the backend still has the full history.
  useEffect(() => {
    const resumeId = searchParams.get("conversationId");
    if (!resumeId) return;
    (async () => {
      try {
        const { messages: history } = await getAssistantConversationMessages(resumeId);
        messageId.current = 1;
        setMessages(
          history.map((m) => ({
            id: messageId.current++,
            sender: m.role === "user" ? "user" : "bot",
            content: m.content,
          })),
        );
        setConversationId(resumeId);
      } catch {
        // Conversation may have expired or belong elsewhere — fall back to a fresh chat silently.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushMessage = (
    sender: ChatMessage["sender"],
    content: string,
    quickReplies?: AssistantQuickReply[],
    action?: AssistantAction,
  ) => {
    setMessages((current) => [
      ...current,
      { id: messageId.current++, sender, content, quickReplies, action },
    ]);
  };

  const clearQuickReplies = () => {
    setMessages((current) =>
      current.map((message) =>
        message.quickReplies
          ? { ...message, quickReplies: undefined }
          : message,
      ),
    );
  };

  const sendMessage = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    clearQuickReplies();
    pushMessage("user", trimmed);
    setInput("");
    setSending(true);
    console.log("[assistant] REQUEST", {
      message: trimmed,
      conversationId: conversationId ?? undefined,
    });
    try {
      const res = await sendAssistantMessage({
        message: trimmed,
        conversationId: conversationId ?? undefined,
      });
      console.log("[assistant] RESPONSE", res);
      setConversationId(res.conversationId);
      pushMessage("bot", res.reply, res.quickReplies, res.action);

      if (res.action?.type === "open_payment_modal") {
        void openPaymentModal(res.action.dueId);
      }
    } catch (err) {
      console.error("[assistant] FAILED", {
        status: err instanceof ApiError ? err.status : undefined,
        code: err instanceof ApiError ? err.code : undefined,
        message: err instanceof Error ? err.message : String(err),
        err,
      });
      pushMessage(
        "bot",
        err instanceof ApiError
          ? err.message
          : "Couldn't reach Duey right now. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = async (
    message: ChatMessage,
    reply: AssistantQuickReply,
  ) => {
    if (sending || joiningId !== null || creatingDueId !== null) return;

    if (message.action?.type === "confirm_join_department") {
      const action = message.action;
      clearQuickReplies();
      pushMessage("user", reply.label);
      setJoiningId(message.id);
      try {
        const res = await confirmAssistantJoin({
          conversationId: conversationId ?? "",
          spaceId: action.spaceId,
          inviteCode: action.inviteCode,
        });
        pushMessage(
          "bot",
          res.status === "joined"
            ? `You've joined ${res.spaceName} ✅`
            : `You're already a member of ${res.spaceName}.`,
        );
      } catch (err) {
        pushMessage(
          "bot",
          err instanceof ApiError
            ? err.message
            : "Couldn't join that department right now. Please try again.",
        );
      } finally {
        setJoiningId(null);
      }
      return;
    }

    if (message.action?.type === "confirm_create_due") {
      const action = message.action;
      clearQuickReplies();
      pushMessage("user", reply.label);
      setCreatingDueId(message.id);
      try {
        const res = await confirmAssistantCreateDue({
          conversationId: conversationId ?? "",
          spaceId: action.spaceId,
          title: action.title,
          amount: action.amount,
          dueDate: action.dueDate,
          category: action.category,
        });
        pushMessage(
          "bot",
          `"${res.title}" was created as a draft for ${res.spaceName} — publish it from your dashboard when you're ready.`,
        );
      } catch (err) {
        pushMessage(
          "bot",
          err instanceof ApiError
            ? err.message
            : "Couldn't create that due right now. Please try again.",
        );
      } finally {
        setCreatingDueId(null);
      }
      return;
    }

    // Duey already resolved this — re-open the modal rather than re-asking the LLM.
    if (message.action?.type === "open_payment_modal") {
      clearQuickReplies();
      await openPaymentModal(message.action.dueId);
      return;
    }

    await sendMessage(reply.value);
  };

  const openPaymentModal = async (dueId: string) => {
    setPayLoading(true);
    try {
      const due = await getDue(dueId);
      const space = await getSpace(due.spaceId);
      setPayDue(adaptDue(due));
      setPaySpace(adaptSpace(space));
    } catch {
      toast.error("Couldn't open payment for this due.");
    } finally {
      setPayLoading(false);
    }
  };

  const finishPayment = (due: Due, space: Space, ref: string) => {
    const payer = {
      name: user?.name ?? "",
      detail: [user?.level ? `${user.level} level` : null, user?.matricNo]
        .filter(Boolean)
        .join(" · "),
    };
    setReceipts(buildReceipts([due], space, payer, [ref]));
    pushMessage("bot", `Payment confirmed! ${naira(due.amount)} for ${due.title} is settled. 🎉`);
  };

  const confirmPay = async (discountCode?: string) => {
    if (!payDue || !paySpace) return;
    setPayPending(true);
    try {
      const result = await payDueApi(payDue.id, { discountCode });

      // Every due payment redirects to a Bachs-hosted checkout page.
      if (result.checkoutUrl && result.reference) {
        setPayDue(null);
        setPaySpace(null);
        window.location.href = result.checkoutUrl;
        return;
      }

      const ref = result.reference ?? "";
      finishPayment(payDue, paySpace, ref);
      setPayDue(null);
      setPaySpace(null);
    } catch {
      toast.error("Payment failed. Please try again.");
    } finally {
      setPayPending(false);
    }
  };

  const closePaymentModal = () => {
    if (payPending) return;
    setPayDue(null);
    setPaySpace(null);
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([starterMessage]);
    messageId.current = 2;
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const { data } = await listAssistantConversations({ perPage: 50 });
      setConversations(data);
    } catch {
      toast.error("Couldn't load your chat history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openConversation = async (
    conversation: AssistantConversationSummary,
  ) => {
    setLoadingConversationId(conversation.id);
    try {
      const { messages: history } = await getAssistantConversationMessages(
        conversation.id,
      );
      messageId.current = 1;
      setMessages(
        history.map((m) => ({
          id: messageId.current++,
          sender: m.role === "user" ? "user" : "bot",
          content: m.content,
        })),
      );
      setConversationId(conversation.id);
      setHistoryOpen(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError && err.status === 404
          ? "That conversation no longer exists."
          : "Couldn't load that conversation.",
      );
    } finally {
      setLoadingConversationId(null);
    }
  };

  const formatHistoryDate = (iso: string) =>
    new Date(iso).toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col lg:h-[calc(100vh-6rem)]">
      {/* Heading */}
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand text-white">
          <HugeiconsIcon icon={AiChat01Icon} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Duey
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            Your dues assistant — ask about payments, balances, or joining a
            department.
          </p>
        </div>
        <button
          type="button"
          onClick={openHistory}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cloud px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors duration-300 hover:border-brand/40 hover:text-brand cursor-pointer"
        >
          <HugeiconsIcon icon={Clock01Icon} size={15} />
          <span className="hidden sm:inline">History</span>
        </button>
        <button
          type="button"
          onClick={startNewChat}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cloud px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors duration-300 hover:border-brand/40 hover:text-brand cursor-pointer"
        >
          <HugeiconsIcon icon={Add01Icon} size={15} />
          New chat
        </button>
      </header>

      {/* Chat panel */}
      <section
        aria-label="Duey chat"
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
                {message.quickReplies && message.quickReplies.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {message.quickReplies.map((reply) => (
                      <button
                        key={reply.label}
                        type="button"
                        disabled={
                          joiningId !== null ||
                          creatingDueId !== null ||
                          sending
                        }
                        onClick={() => handleQuickReply(message, reply)}
                        className="inline-flex items-center rounded-full border border-brand/25 bg-brand/5 px-3.5 py-1.5 text-xs font-semibold text-brand transition-colors duration-300 hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-pointer"
                      >
                        {joiningId === message.id
                          ? "Joining…"
                          : creatingDueId === message.id
                            ? "Creating…"
                            : reply.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {sending && (
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

          <div ref={bottomRef} />
        </div>

        {/* Example prompts — shown until the visitor sends their first message. */}
        {showExamples && (
          <div className="bg-canvas px-4 p-3 sm:px-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {exampleQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendMessage(question)}
                  className="rounded-full border border-cloud bg-paper px-3.5 py-1.5 text-xs font-medium text-ink-soft transition-colors duration-300 hover:border-brand/40 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-pointer"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
          className="flex items-center gap-3 border-t border-cloud bg-canvas p-4"
        >
          <div className="gradient-border-spin min-w-0 flex-1 rounded-2xl p-px">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your dues..."
              aria-label="Message Duey"
              disabled={sending}
              className="w-full min-w-0 rounded-xl border-0 bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors duration-300 placeholder:text-ink-soft/70 focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || sending}
            aria-label="Send message"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-white transition-colors duration-300 hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-pointer"
          >
            <HugeiconsIcon icon={SentIcon} size={18} />
          </button>
        </form>
      </section>

      {payLoading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cloud border-t-brand" />
        </div>
      )}

      {payDue && paySpace && (
        <PayDueModal
          dues={[payDue]}
          space={paySpace}
          pending={payPending}
          onClose={closePaymentModal}
          onConfirm={confirmPay}
        />
      )}

      {receipts.length > 0 && (
        <ReceiptModal receipts={receipts} onClose={() => setReceipts([])} />
      )}

      {historyOpen && (
        <Modal
          title="Chat history"
          icon={Clock01Icon}
          onClose={() => setHistoryOpen(false)}
        >
          {historyLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-2xl bg-paper"
                />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={Message01Icon}
              title="No conversations yet"
              description="Chats you start with Duey will show up here."
            />
          ) : (
            <ul className="space-y-2">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    disabled={loadingConversationId !== null}
                    onClick={() => openConversation(conversation)}
                    className="w-full rounded-2xl border border-cloud bg-paper/40 p-3.5 text-left transition-colors duration-300 hover:border-brand/40 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <p className="line-clamp-2 whitespace-pre-line text-[13px] leading-5 text-ink">
                      {loadingConversationId === conversation.id
                        ? "Loading…"
                        : conversation.preview}
                    </p>
                    <p className="mt-1.5 text-[11px] text-ink-soft">
                      {formatHistoryDate(conversation.updatedAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}
