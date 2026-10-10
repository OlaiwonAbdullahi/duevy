import type { ApiErrorDetail } from "./types";

/** Thrown for any non-2xx API response, carrying the server's error envelope. */
export class ApiError extends Error {
  code: string;
  status: number;
  details?: ApiErrorDetail[];
  /** The envelope's `data`, when the server sends one alongside the error
   * (e.g. `REP_APPROVAL_PENDING` returns the created user). */
  data?: unknown;

  constructor(
    message: string,
    {
      code,
      status,
      details,
      data,
    }: { code: string; status: number; details?: ApiErrorDetail[]; data?: unknown },
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.data = data;
  }
}

/** Thrown when a response can't be reached or parsed at all (offline, CORS, 5xx HTML page, etc). */
export class NetworkError extends Error {
  constructor(message = "Couldn't reach the server. Check your connection and try again.") {
    super(message);
    this.name = "NetworkError";
  }
}
