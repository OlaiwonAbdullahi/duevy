import { apiClient } from "./client";

export type FeedbackCategory = "bug" | "idea" | "other";
export type FeedbackStatus = "new" | "resolved";

export type Feedback = {
  id: string;
  category: FeedbackCategory;
  message: string;
  /** App path it was sent from, e.g. "/dashboard/payout". */
  page: string | null;
  userAgent: string | null;
  status: FeedbackStatus;
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
};

/** Limits enforced by the API (`400 VALIDATION_ERROR` outside them). */
export const FEEDBACK_MIN = 10;
export const FEEDBACK_MAX = 2000;

/** Any signed-in user. Limited to 5 per 10 minutes (`429 RATE_LIMITED`). */
export function submitFeedback(payload: { category: FeedbackCategory; message: string; page?: string }) {
  return apiClient.post<Feedback>("/feedback", payload);
}
