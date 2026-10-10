import { apiClient, type Page } from "./client";
import type { Dispute, DisputeType } from "./types";

export type FileDisputePayload = {
  type: DisputeType;
  transactionReference?: string;
  description: string;
};

/** File a dispute (student or rep). */
export function fileDispute(payload: FileDisputePayload) {
  return apiClient.post<Dispute>("/disputes", payload);
}

/** The caller's disputes. */
export function listDisputes(): Promise<Page<Dispute[]>> {
  return apiClient.getPage<Dispute[]>("/disputes");
}
