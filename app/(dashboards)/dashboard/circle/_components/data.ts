/** Base for every space join link. Students open this to join automatically. */
export const JOIN_BASE_URL = "https://duevy.app/join";

export function joinLink(code: string) {
  return `${JOIN_BASE_URL}/${code}`;
}
