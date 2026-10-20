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
};

export type CollectionTotals = {
  paid: number;
  unpaid: number;
  collected: number;
  expected: number;
  rate: number;
};
