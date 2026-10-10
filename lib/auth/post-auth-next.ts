const KEY = "duevy_post_auth_next";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Only ever follow an internal path — never let a stored value redirect off-site. */
function safeNext(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

/**
 * Persists the post-auth destination across the signup -> verify-email hop,
 * which can happen in a different tab or device than the one that started
 * signup (so the `next` query param alone can't survive it).
 */
export function savePostAuthNext(path: string) {
  const clean = safeNext(path);
  if (!clean) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ path: clean, savedAt: Date.now() }));
  } catch {
    // Private browsing / storage disabled — the URL-based `next` still works
    // for same-tab flows, so this is a soft failure.
  }
}

export function readPostAuthNext(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { path, savedAt } = JSON.parse(raw) as { path?: string; savedAt?: number };
    if (typeof savedAt !== "number" || Date.now() - savedAt > MAX_AGE_MS) return null;
    return safeNext(path);
  } catch {
    return null;
  }
}

export function clearPostAuthNext() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do — worst case a stale entry expires on its own via MAX_AGE_MS.
  }
}
