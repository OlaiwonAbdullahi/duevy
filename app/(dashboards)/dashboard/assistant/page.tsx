"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiChat01Icon,
  Message01Icon,
  SentIcon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import {
  sendAssistantMessage,
  confirmAssistantJoin,
  type AssistantAction,
  type AssistantQuickReply,
} from "@/lib/api/assistant";
import { getDue, payDue as payDueApi } from "@/lib/api/dues";
import { getSpace } from "@/lib/api/spaces";
import { getWallet, listCards } from "@/lib/api/wallet";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { adaptDue, adaptSpace } from "../dues/_components/adapt";
import type { Due, PayMethod, Space } from "../dues/_components/types";
import type { Card } from "../wallet/_components/types";
import { PayDueModal } from "../dues/_components/PayDueModal";
import { ReceiptModal } from "../dues/_components/ReceiptModal";
import { buildReceipts, type Receipt } from "../dues/_components/receipt";
import { naira, fromKobo } from "../_components/format";

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
];

/** Online payments redirect to Monnify's hosted checkout. */
function redirectToCheckout(url: string) {
  window.location.href = url;
}

export default function AssistantPage() {
  const { user } = useAuth();
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
  const [payBalance, setPayBalance] = useState(0);
  const [payCards, setPayCards] = useState<Card[]>([]);
  const [payLoading, setPayLoading] = useState(false);
  const [payPending, setPayPending] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const showExamples = messages.length === 1 && !sending;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

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
        message.quickReplies ? { ...message, quickReplies: undefined } : message,
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
    try {
      const res = await sendAssistantMessage({
        message: trimmed,
        conversationId: conversationId ?? undefined,
      });
      setConversationId(res.conversationId);
      pushMessage("bot", res.reply, res.quickReplies, res.action);

      if (res.action?.type === "open_payment_modal") {
        void openPaymentModal(res.action.dueId);
      }
    } catch (err) {
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

  const handleQuickReply = async (message: ChatMessage, reply: AssistantQuickReply) => {
    if (sending || joiningId !== null) return;

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

    await sendMessage(reply.value);
  };

  const openPaymentModal = async (dueId: string) => {
    setPayLoading(true);
    try {
      const due = await getDue(dueId);
      const [space, wallet, cards] = await Promise.all([
        getSpace(due.spaceId),
        getWallet(),
        listCards(),
      ]);
      setPayDue(adaptDue(due));
      setPaySpace(adaptSpace(space));
      setPayBalance(fromKobo(wallet.balance));
      setPayCards(cards);
    } catch {
      toast.error("Couldn't open payment for this due.");
    } finally {
      setPayLoading(false);
    }
  };

  const confirmPay = async (method: PayMethod, card?: Card) => {
    if (!payDue || !paySpace) return;
    setPayPending(true);
    try {
      const result = await payDueApi(
        payDue.id,
        method === "card" && card
          ? { method: "card", cardId: card.id }
          : method === "online"
            ? { method: "online" }
            : { method: "wallet" },
      );

      if (method === "online" && result.checkoutUrl) {
        redirectToCheckout(result.checkoutUrl);
        return;
      }

      const ref = result.transaction?.reference ?? result.reference ?? "";
      const payer = {
        name: user?.name ?? "",
        detail: [user?.level ? `${user.level} level` : null, user?.matricNo]
          .filter(Boolean)
          .join(" · "),
      };
      setReceipts(buildReceipts([payDue], paySpace, method, payer, [ref], card));
      pushMessage(
        "bot",
        `Payment confirmed! ${naira(payDue.amount)} for ${payDue.title} is settled. 🎉`,
      );
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
                        disabled={joiningId !== null || sending}
                        onClick={() => handleQuickReply(message, reply)}
                        className="inline-flex items-center rounded-full border border-brand/25 bg-brand/5 px-3.5 py-1.5 text-xs font-semibold text-brand transition-colors duration-300 hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-pointer"
                      >
                        {joiningId === message.id ? "Joining…" : reply.label}
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

          {/* Example prompts — shown until the visitor sends their first message. */}
          {showExamples && (
            <div className="pl-10.5">
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
            void sendMessage();
          }}
          className="flex items-center gap-3 border-t border-cloud bg-canvas p-4"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about your dues..."
            aria-label="Message Duey"
            disabled={sending}
            className="min-w-0 flex-1 rounded-xl border border-cloud bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors duration-300 placeholder:text-ink-soft/70 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
          />
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
          balance={payBalance}
          cards={payCards}
          pending={payPending}
          onClose={closePaymentModal}
          onConfirm={confirmPay}
        />
      )}

      {receipts.length > 0 && (
        <ReceiptModal receipts={receipts} onClose={() => setReceipts([])} />
      )}
    </div>
  );
}
