import { siteOrigin } from "@/lib/site-url";

/** A space's join link. Students open this to join automatically. */
export function joinLink(code: string) {
  return `${siteOrigin()}/join/${code}`;
}
