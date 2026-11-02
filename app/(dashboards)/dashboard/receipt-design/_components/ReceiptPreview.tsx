/* eslint-disable @next/next/no-img-element -- data URLs and static artwork, nothing for next/image to optimise. */
import { cn } from "@/lib/utils";
import { RECEIPT_DEFAULTS, type ReceiptDesign } from "@/lib/api/receipt-design";

/** Mix a #rrggbb colour toward black — the header shade, as the PDF does it. */
function darken(hex: string, by: number) {
  const n = parseInt(hex.slice(1), 16);
  return `#${[16, 8, 0].map((s) => Math.round(((n >> s) & 255) * (1 - by)).toString(16).padStart(2, "0")).join("")}`;
}

/** The made-up payment the backend's sample PDF uses, so the two match. */
const SAMPLE = {
  payer: "Tolu Adeyemi",
  item: "Departmental due",
  face: "₦5,000.00",
  fee: "₦120.00",
  total: "₦5,120.00",
  number: "R-SAMPLE",
  reference: "DVY-SAMPLE-0001",
  answers: [["Phone number", "08031420517"]] as const,
};

const label = "text-[8px] font-semibold uppercase tracking-[0.1em] text-[#a3aca7]";

/**
 * A live, HTML stand-in for the PDF receipt (lib/receipt.ts in the backend):
 * same layout, colours and wording, redrawn as the rep types. The real PDF is
 * one click away via "Download sample PDF".
 */
export function ReceiptPreview({ design, spaceName }: { design: ReceiptDesign; spaceName: string }) {
  const accent = design.accent ?? RECEIPT_DEFAULTS.accent;
  const deep = design.accent ? darken(design.accent, 0.2) : "#08583f";
  const stamp = (design.stampText || RECEIPT_DEFAULTS.stampText).toUpperCase();
  const signatures = design.signatures.filter((s) => s.image || s.name || s.role);
  const now = new Date().toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div className="overflow-hidden rounded-2xl bg-[#f4f2ec] text-[#1b2520] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)]">
      {/* Header */}
      {/* A rep's logo is bigger than Duevy's, so the header grows to fit it (as the PDF does). */}
      <div className={cn("relative px-4 pt-4", design.logo ? "h-[184px]" : "h-[160px]")} style={{ backgroundColor: deep }}>
        {design.headerStyle === "artwork" && (
          <img
            src="/doodle-card.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: design.accent ? 0.35 : 1 }}
          />
        )}
        <div className="relative flex items-start justify-between gap-3">
          {design.logo ? (
            <img src={design.logo} alt="" className="h-10 min-w-0 max-w-[60%] shrink object-contain object-left" />
          ) : (
            <img src="/logos/duevy-logo-white.png" alt="Duevy" className="h-4" />
          )}
          <div className="min-w-0 shrink-0 text-right">
            <p className="truncate text-[7px] font-semibold uppercase tracking-[0.14em] text-[#cfe6dc]">
              {design.title || RECEIPT_DEFAULTS.title}
            </p>
            <p className="text-[9px] font-bold text-white">{SAMPLE.number}</p>
          </div>
        </div>
        <p className="relative mt-3 text-center text-[9px] text-[#cfe6dc]">Total paid</p>
        <p className="relative text-center text-[26px] font-bold leading-tight text-white">{SAMPLE.total}</p>
        <p className="relative mt-1 flex items-center justify-center gap-1.5 text-[8px] text-[#cfe6dc]">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold text-white">
            <span className="h-1 w-1 rounded-full bg-[#6ee7b7]" /> Paid
          </span>
          {now}
        </p>
      </div>

      {/* Ticket card */}
      <div className="relative z-10 mx-3 -mt-8 rounded-xl bg-white px-4 pb-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={label}>Paid to</p>
            <p className="mt-0.5 truncate text-[10px] font-semibold">{spaceName}</p>
          </div>
          <div>
            <p className={label}>Paid by</p>
            <p className="mt-0.5 truncate text-[10px] font-semibold">{SAMPLE.payer}</p>
          </div>
        </div>

        <div className="mt-3 flex justify-between rounded-md bg-[#f7f6f2] px-2.5 py-1.5 text-[7px] font-semibold uppercase tracking-[0.1em] text-[#7a847f]">
          <span>Due paid</span>
          <span>Amount</span>
        </div>
        <div className="flex justify-between px-2.5 py-2 text-[9.5px]">
          <span>{SAMPLE.item}</span>
          <span className="font-semibold">{SAMPLE.face}</span>
        </div>

        <div className="relative mt-1 flex items-center border-t border-[#e8ece9] pt-2.5">
          <div className="grid w-[40%] place-items-center">
            {design.showStamp && <Stamp design={design} word={stamp} color={design.stampColor ?? accent} />}
          </div>
          <div className="flex-1 text-[9px]">
            <p className="flex justify-between text-[#7a847f]">
              Due amount <span className="font-semibold text-[#1b2520]">{SAMPLE.face}</span>
            </p>
            <p className="mt-1 flex justify-between text-[#7a847f]">
              Service charge <span className="font-semibold text-[#1b2520]">{SAMPLE.fee}</span>
            </p>
            <p
              className="mt-1.5 flex justify-between rounded-lg px-2.5 py-2 text-[9.5px] font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              <span className="text-[#cfe6dc]">Total paid</span> {SAMPLE.total}
            </p>
          </div>
        </div>

        <div className="my-3 border-t border-dashed border-[#d9ddd9]" />

        <Rows
          title="Details"
          rows={[
            ["Receipt no.", SAMPLE.number],
            ["Reference", SAMPLE.reference],
            ["Method", "Bank transfer"],
          ]}
        />
        {design.showAnswers && <Rows title="Your details" rows={SAMPLE.answers} />}

        {design.note && (
          <div className="mt-3">
            <p className={label}>Note</p>
            <p className="mt-1 whitespace-pre-line break-words rounded-md bg-[#f7f6f2] px-2.5 py-2 text-[9px]">{design.note}</p>
          </div>
        )}

        {signatures.length > 0 && (
          // Side by side and right-aligned, every line level, as in the PDF.
          <div className="mt-4 flex items-end justify-end gap-3">
            {signatures.map((s) => (
              <div key={s.id} className="min-w-0 max-w-[120px] flex-1 text-center">
                {s.image ? (
                  <img src={s.image} alt="Signature" className="mx-auto h-9 max-w-full object-contain" />
                ) : (
                  <div className="h-9" />
                )}
                <div className="border-t border-[#a3aca7] pt-1">
                  {s.name && <p className="truncate text-[9px] font-semibold">{s.name}</p>}
                  {s.role && <p className="truncate text-[8px] text-[#7a847f]">{s.role}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-4 text-center">
        <p className="break-words text-[9px] font-semibold">{design.thankYou || RECEIPT_DEFAULTS.thankYou}</p>
        <p className="mt-2 text-[7px] text-[#a3aca7]">
          {design.logo ? "Powered by Duevy · " : ""}duevy.app · support@duevy.app
        </p>
      </div>
    </div>
  );
}

/** The stamp as the PDF draws it: an uploaded image, or a round seal, rubber stamp or ribbon. */
function Stamp({ design, word, color }: { design: ReceiptDesign; word: string; color: string }) {
  const long = word.length > 5;
  if (design.stampImage) {
    return <img src={design.stampImage} alt="Stamp" className="h-[58px] max-w-[66px] object-contain" />;
  }
  const brand = <span className="block text-[5px] font-semibold tracking-[0.2em]">DUEVY</span>;

  if (design.stampStyle === "rect") {
    return (
      <span className="-rotate-[10deg] rounded-[4px] border-[1.5px] p-[2px]" style={{ borderColor: color, color }}>
        <span className="block rounded-[2px] border-[0.5px] px-2 py-1 text-center leading-none" style={{ borderColor: color }}>
          <span className={cn("block font-bold", long ? "text-[8px]" : "text-[11px] tracking-wider")}>{word}</span>
          {brand}
        </span>
      </span>
    );
  }

  if (design.stampStyle === "ribbon") {
    return (
      <span
        className="relative grid h-[20px] w-[78px] -rotate-[8deg] place-items-center text-white"
        style={{ backgroundColor: color, clipPath: "polygon(0 0, 100% 0, 91% 50%, 100% 100%, 0 100%, 9% 50%)" }}
      >
        <span className="absolute inset-x-[10px] inset-y-[3px] border-y border-dashed border-white/80" />
        <span className={cn("font-bold leading-none", long ? "text-[7px]" : "text-[9px] tracking-wider")}>{word}</span>
      </span>
    );
  }

  return (
    <span className="grid h-[52px] w-[52px] -rotate-[14deg] place-items-center rounded-full border-[1.5px] p-[3px]" style={{ borderColor: color, color }}>
      <span className="grid h-full w-full place-items-center rounded-full border-[0.5px] text-center leading-none" style={{ borderColor: color }}>
        <span>
          <span className={cn("block font-bold", long ? "text-[7.5px]" : "text-[12px] tracking-wider")}>{word}</span>
          {brand}
        </span>
      </span>
    </span>
  );
}

function Rows({ title, rows }: { title: string; rows: readonly (readonly [string, string])[] }) {
  return (
    <div className="mt-2 first:mt-0">
      <p className={label}>{title}</p>
      <dl className="mt-1 flex flex-col gap-1 text-[9px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-[#7a847f]">{k}</dt>
            <dd className="truncate font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
