import type { DueCategory } from "../../dues/_components/types";

/** A rep-raised due's lifecycle: collecting, not yet published, or wound up. */
export type RepDueStatus = "active" | "draft" | "closed";

export type RepDue = {
  id: string;
  title: string;
  note: string;
  amount: number;
  /** yyyy-mm-dd deadline. */
  dueDate: string;
  category: DueCategory;
  allowGuests: boolean;
  status: RepDueStatus;
  /** Members who've settled it — drives the collection progress. */
  paidCount: number;
  memberCount: number;
};

/** The editable slice a rep fills in when creating or editing a due. */
export type DueDraft = Pick<
  RepDue,
  "title" | "note" | "amount" | "dueDate" | "category" | "allowGuests"
>;
