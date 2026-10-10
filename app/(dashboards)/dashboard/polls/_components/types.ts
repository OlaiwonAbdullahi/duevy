export type { Poll, PollCategory, PollNominee, PollStatus } from "@/lib/api/types";

/** A nominee row while it's still being built in the form — has a client-side
 *  id for React keys/edits, but no server id or vote count yet. */
export type EditorNominee = {
  id: string;
  name: string;
  /** Set as soon as a photo is picked — uploaded immediately, before the poll exists. */
  imageUrl?: string;
  bio?: string;
  code?: string;
};

/** A category row while it's still being built in the form. */
export type EditorCategory = {
  id: string;
  title: string;
  imageUrl?: string;
  nominees: EditorNominee[];
};
