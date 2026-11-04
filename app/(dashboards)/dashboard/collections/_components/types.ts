export type PaymentStatus = "paid" | "unpaid";
export type StatusFilter = "all" | PaymentStatus;

export type CollectionStudent = {
  id: string;
  name: string;
  matricNo: string;
  level: string;
  email: string;
  status: PaymentStatus;
  paidAt?: string;
  /** Raw ISO payment time, for exports. */
  paidOn?: string;
  reference?: string;
  /** "link": paid through the due's pay link without being a member. Members leave it unset. */
  via?: "link";
  /** A pay-link payer's answers to the due's questions. */
  answers?: { label: string; value: string }[];
};

export type CollectionTotals = {
  /** Members who've paid. */
  paid: number;
  /** Members still owing. */
  unpaid: number;
  /** Paid through the pay link without being a member. Their money is in `collected`. */
  linkPaid: number;
  collected: number;
  expected: number;
  /** What the unpaid members still owe. */
  outstanding: number;
  rate: number;
};
