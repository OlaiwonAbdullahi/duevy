const ITEMS = [
  "DUES", "HANDOUTS", "DEPARTMENTAL FEES", "COURSE MATERIALS",
  "LEVIES", "TEXTBOOKS", "ASSOCIATION FEES", "LAB FEES",
  "DUES", "HANDOUTS", "DEPARTMENTAL FEES", "COURSE MATERIALS",
  "LEVIES", "TEXTBOOKS", "ASSOCIATION FEES", "LAB FEES",
];

export default function Ticker() {
  return (
    <div className="border-y border-[#e5e7eb] bg-[#f9fafb] py-3 overflow-hidden">
      <div className="flex gap-10 whitespace-nowrap" style={{ animation: "ticker 30s linear infinite" }}>
        {ITEMS.map((item, i) => (
          <span key={i} className="text-xs font-semibold tracking-[0.25em] text-[#374151]/50 flex items-center gap-10">
            {item}
            <span className="text-[#10b981]/40">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
