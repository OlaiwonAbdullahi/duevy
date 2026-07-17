import { apiClient } from "./client";

export type AssistantIntent =
  | "pay_dues"
  | "join_department"
  | "check_balance"
  | "view_history"
  | "contact_rep"
  | "unknown";

export type AssistantQuickReply = { label: string; value: string };

export type AssistantAction =
  | { type: "open_payment_modal"; dueId: string }
  | { type: "confirm_join_department"; spaceId: string; inviteCode: string }
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
