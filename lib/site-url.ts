/**
 * The origin to build shareable links from: the site the user is actually on
 * (so staging/preview links stay on staging), falling back to
 * `NEXT_PUBLIC_SITE_URL`, then production, when rendered without a window.
 */
export function siteOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://duevy.app").replace(/\/$/, "");
}
