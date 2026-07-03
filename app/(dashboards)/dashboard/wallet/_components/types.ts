export type Card = {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
};

export type Activity = {
  id: string;
  label: string;
  detail: string;
  amount: number; // positive = money in, negative = money out
};

export type TopUpSource = { source: "card"; card: Card } | { source: "online" };

export type TopUpMethod = "card" | "online";
