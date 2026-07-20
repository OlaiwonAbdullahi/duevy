import { apiClient, type Page } from "./client";

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export type AssistantIntent =
  | "pay_dues"
  | "join_department"
  | "check_balance"
  | "view_history"
  | "contact_rep"
  | "create_due"
  | "rep_summary"
  | "unknown";

export type AssistantQuickReply = { label: string; value: string };

export type AssistantDueCategory =
  | "levy"
  | "dinner"
  | "handout"
  | "welfare"
  | "sport";

export type AssistantAction =
  | { type: "open_payment_modal"; dueId: string }
  | { type: "confirm_join_department"; spaceId: string; inviteCode: string }
  | {
      type: "confirm_create_due";
      spaceId: string;
      title: string;
      amount: number;
      dueDate: string;
      category: AssistantDueCategory;
    }
  | null;

export type AssistantMessageResult = {
  conversationId: string;
  intent: AssistantIntent;
  confidence: number;
  needsClarification: boolean;
  reply: string;
  quickReplies: AssistantQuickReply[];
  action: AssistantAction;
};

/** Send one chat turn to Duey. Omit `conversationId` to start a new conversation. */
export function sendAssistantMessage(payload: {
  message: string;
  conversationId?: string;
}) {
  return apiClient.post<AssistantMessageResult>("/assistant/message", payload);
}

export type AssistantConfirmJoinResult =
  | { status: "joined"; spaceName: string; joinedAt: string }
  | { status: "already_member"; spaceName: string };

/** Explicit human-confirmation step for `confirm_join_department` — never join straight from `/message`. */
export function confirmAssistantJoin(payload: {
  conversationId: string;
  spaceId: string;
  inviteCode: string;
}) {
  return apiClient.post<AssistantConfirmJoinResult>(
    "/assistant/confirm",
    payload,
  );
}

export type AssistantConfirmCreateDueResult = {
  status: "created";
  dueId: string;
  title: string;
  spaceName: string;
};

/** Explicit human-confirmation step for `confirm_create_due` (rep-only) — never created straight from `/message`. Created as a draft; the rep still publishes it from the dashboard. */
export function confirmAssistantCreateDue(payload: {
  conversationId: string;
  spaceId: string;
  title: string;
  amount: number;
  dueDate: string;
  category: AssistantDueCategory;
}) {
  return apiClient.post<AssistantConfirmCreateDueResult>(
    "/assistant/confirm",
    payload,
  );
}

export type AssistantConversationSummary = {
  id: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
};

/** Past conversations with Duey, most recent first. */
export function listAssistantConversations(
  query: { page?: number; perPage?: number } = {},
): Promise<Page<AssistantConversationSummary[]>> {
  return apiClient.getPage<AssistantConversationSummary[]>(
    `/assistant/conversations${toQuery(query)}`,
  );
}

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent: AssistantIntent | null;
  confidence: number | null;
  createdAt: string;
};

export type AssistantConversationMessages = {
  conversationId: string;
  messages: AssistantMessage[];
};

/** Full transcript of one conversation. 404s if it doesn't exist or belongs to someone else. */
export function getAssistantConversationMessages(conversationId: string) {
  return apiClient.get<AssistantConversationMessages>(
    `/assistant/conversations/${conversationId}/messages`,
  );
}
