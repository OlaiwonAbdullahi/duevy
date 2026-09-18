/**
 * Demo mode — the whole app runs against an in-browser fixture store instead of
 * the live API, so a presenter can sign in as a student or a rep and drive every
 * flow (pay a due, raise a due, request a payout, run a poll) with no backend,
 * no network, and no risk of another viewer corrupting shared state.
 *
 * Wired in at `lib/api/client`, which is the single chokepoint every
 * `lib/api/*` module goes through. Nothing above that layer knows demo mode
 * exists.
 *
 * On by default for this branch. Set NEXT_PUBLIC_DEMO_MODE=false to point the
 * app back at the real API.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

/** Shared password for both demo accounts — also accepted by the normal login form. */
export const DEMO_PASSWORD = "Demo1234!";

export type DemoRole = "student" | "rep";

export type DemoAccount = {
  role: DemoRole;
  email: string;
  name: string;
  /** Shown on the login page button. */
  label: string;
  blurb: string;
};

export const DEMO_ACCOUNTS: Record<DemoRole, DemoAccount> = {
  student: {
    role: "student",
    email: "student@duevy.demo",
    name: "Aisha Bello",
    label: "Continue as a student",
    blurb: "Aisha Bello · 300L Computer Science",
  },
  rep: {
    role: "rep",
    email: "rep@duevy.demo",
    name: "Tunde Okafor",
    label: "Continue as a rep",
    blurb: "Tunde Okafor · Lead rep, CSSA",
  },
};

/**
 * Simulated round-trip, so skeletons and pending states are visible on screen
 * instead of flashing past. Short enough not to make the demo feel sluggish.
 */
export const DEMO_LATENCY_MS = 220;
