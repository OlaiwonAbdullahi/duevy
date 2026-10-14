import type { DueType } from "../../dues/_components/types";

/** A rep-raised due's lifecycle: collecting, not yet published, or wound up. */
export type RepDueStatus = "active" | "draft" | "closed";

export type RepDue = {
  id: string;
  title: string;
  note: string;
  amount: number;
  /** yyyy-mm-dd deadline. */
  dueDate: string;
  /** The due's `type`. */
  category: DueType;
  status: RepDueStatus;
  /** Members who've settled it — drives the collection progress. */
  paidCount: number;
  memberCount: number;
  /** The rep who can withdraw this due's collections — the creator, or a co-rep the lead picks. */
  assignedRepId: string | null;
};

/** The editable slice a rep fills in when creating or editing a due. */
export type DueDraft = Pick<
  RepDue,
  "title" | "note" | "amount" | "dueDate" | "category"
> & {
  /** New dues only: the co-rep who can withdraw its collections. Omitted = the creator. */
  assignedRepId?: string;
};
