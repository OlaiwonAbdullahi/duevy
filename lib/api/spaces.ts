import { apiClient } from "./client";
import type { JoinableDepartment, Space } from "./types";

/** Spaces the caller belongs to (member + guest). */
export function listSpaces() {
  return apiClient.get<Space[]>("/spaces");
}

export function getSpace(spaceId: string) {
  return apiClient.get<Space>(`/spaces/${spaceId}`);
}

/** Resolve a join code to a department preview (+ its active dues). Rate-limited. */
export function lookupSpace(code: string) {
  return apiClient.post<JoinableDepartment>("/spaces/lookup", { code });
}

export type JoinSpacePayload = {
  code: string;
  as?: "member" | "guest";
};

export type JoinSpaceResult = {
  spaceId: string;
  status: string;
  membership: "member" | "guest";
  joinedAt: string;
};

/** Join by code — immediate for anyone with a valid code (reps don't gate admission). */
export function joinSpace(spaceId: string, payload: JoinSpacePayload) {
  return apiClient.post<JoinSpaceResult>(`/spaces/${spaceId}/join`, payload);
}

/** Leave a space (student danger zone). */
export function leaveSpace(spaceId: string) {
  return apiClient.delete<void>(`/spaces/${spaceId}/membership`);
}
