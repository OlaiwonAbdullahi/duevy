import { API_BASE_URL } from "./config";
import { ApiError, NetworkError } from "./errors";
import type { ApiMeta, ApiResponse } from "./types";

/** A list response plus its pagination envelope (`meta`). */
export type Page<T> = { data: T; meta?: ApiMeta };

/**
 * The access token lives in memory only (never localStorage/sessionStorage) so
 * it can't be read by an XSS payload. Session persistence across page loads is
 * handled by the httpOnly refresh cookie via `/auth/refresh` (see AuthProvider).
 */
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Attach the bearer token. Default true — pass false for public endpoints. */
  auth?: boolean;
  /** Retry once after a silent token refresh on 401. Default true. */
  retryOn401?: boolean;
  /** Required by the API for payment/wallet state-changing requests. */
  idempotencyKey?: string;
};

let refreshPromise: Promise<string> | null = null;

/**
 * Rotates the refresh cookie and stores the new access token. Dedupes concurrent
 * callers (both the 401-retry path below and `AuthProvider`'s startup bootstrap
 * can call this at the same time).
 */
export async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = rawRequest<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
      auth: false,
    })
      .then(({ accessToken: token }) => {
        setAccessToken(token);
        return token;
      })
      .catch((err) => {
        setAccessToken(null);
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function rawRequestFull<T>(path: string, options: RequestOptions = {}): Promise<Page<T>> {
  const { auth = true, retryOn401 = true, idempotencyKey, headers, body, ...init } = options;

  const finalHeaders = new Headers(headers);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (auth && accessToken) {
    finalHeaders.set("Authorization", `Bearer ${accessToken}`);
  }
  if (idempotencyKey) {
    finalHeaders.set("Idempotency-Key", idempotencyKey);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: finalHeaders,
      credentials: "include",
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new NetworkError();
  }

  if (res.status === 204) {
    return { data: undefined as T };
  }

  let payload: ApiResponse<T> | undefined;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON error page (e.g. gateway 502) — fall through to status-based message below.
  }

  if (!res.ok || !payload || payload.success === false) {
    if (
      res.status === 401 &&
      auth &&
      retryOn401 &&
      path !== "/auth/refresh" &&
      path !== "/auth/login"
    ) {
      await refreshAccessToken();
      return rawRequestFull<T>(path, { ...options, retryOn401: false });
    }

    if (payload && payload.success === false) {
      throw new ApiError(payload.error.message, {
        code: payload.error.code,
        status: res.status,
        details: payload.error.details,
        // Some business errors ship a payload too (e.g. REP_APPROVAL_PENDING
        // returns the newly created user); preserve it for the caller.
        data: (payload as { data?: unknown }).data,
      });
    }
    throw new ApiError(res.statusText || "Something went wrong. Please try again.", {
      code: "UNKNOWN_ERROR",
      status: res.status,
    });
  }

  return { data: payload.data, meta: payload.meta };
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return (await rawRequestFull<T>(path, options)).data;
}

/** GET a binary file (report export, receipt PDF, …) with the bearer token attached. */
async function fetchBlob(path: string, retryOn401 = true): Promise<Blob> {
  const headers = new Headers();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { headers, credentials: "include" });
  } catch {
    throw new NetworkError();
  }

  if (res.status === 401 && retryOn401) {
    await refreshAccessToken();
    return fetchBlob(path, false);
  }

  if (!res.ok) {
    throw new ApiError("Couldn't download this file.", {
      code: "DOWNLOAD_FAILED",
      status: res.status,
    });
  }

  return res.blob();
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    rawRequest<T>(path, { ...options, method: "GET" }),
  /** GET that also returns the `meta` envelope (pagination, `unreadCount`, …). */
  getPage: <T>(path: string, options?: RequestOptions) =>
    rawRequestFull<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    rawRequest<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    rawRequest<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    rawRequest<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    rawRequest<T>(path, { ...options, method: "DELETE" }),
  getBlob: (path: string) => fetchBlob(path),
};
