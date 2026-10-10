export function formatMoneyNGN(amount: number) {
  try {
    return new Intl.NumberFormat("en-NG", {
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return String(amount);
  }
}

export function formatPercent01(value: number) {
  const pct = Math.round(value * 100);
  return `${pct}%`;
}

