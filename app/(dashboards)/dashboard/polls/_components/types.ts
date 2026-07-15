export type { Poll, PollCategory, PollNominee, PollStatus } from "@/lib/api/types";

/** A nominee row while it's still being built in the form — has a client-side
 *  id for React keys/edits, but no server id or vote count yet. */
export type EditorNominee = {
  id: string;
  name: string;
};

/** A category row while it's still being built in the form. */
export type EditorCategory = {
  id: string;
  title: string;
  nominees: EditorNominee[];
};
