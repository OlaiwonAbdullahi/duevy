import { ImageResponse } from "next/og";
import { OG_COLORS as C, OG_SIZE, OgNaira, ogAssets, ogFonts } from "@/lib/og";
import { CATEGORY_LABEL } from "@/app/(dashboards)/dashboard/dues/_components/data";
import { loadShareDue, shareDate } from "./share";

/** Bar widths for the ticket's barcode, from the due id (same due, same bars). */
function barcode(seed: string) {
  return Array.from(
    { length: 34 },
    (_, i) => 2 + ((seed.charCodeAt(i % seed.length) * (i + 7)) % 4) * 1.5,
  );
}

const shareNairaLength = (kobo: number) =>
  Math.round(kobo / 100).toLocaleString("en-NG").length;

export const alt = "Pay your dues with Duevy";
export const size = OG_SIZE;
export const contentType = "image/png";

/**
 * A pay link's preview card: the due, its amount and deadline, so a class group
 * sees what they're paying before they tap. A link that isn't open gets a plain
 * Duevy card rather than an error.
 */
export default async function PayLinkImage({
  params,
}: {
  params: Promise<{ dueId: string }>;
}) {
  const { dueId } = await params;
  const [due, { doodle, logo }, fonts] = await Promise.all([
    loadShareDue(dueId),
    ogAssets(),
    ogFonts(),
  ]);

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        background: C.deep,
        fontFamily: "Manrope",
      }}
    >
      <img
        src={doodle}
        alt=""
        width={1200}
        height={640}
        style={{ position: "absolute", inset: 0, objectFit: "cover" }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          padding: "60px 0 0 64px",
          gap: 24,
        }}
      >
        {/* What it is. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            paddingBottom: 60,
          }}
        >
          <img src={logo} alt="" height={46} width={160} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 26, fontWeight: 500, color: C.mint }}>
              {due ? due.spaceName : "Duevy pay link"}
            </span>
            <span
              style={{
                marginTop: 12,
                fontSize: due && due.title.length > 28 ? 58 : 70,
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: -2,
                color: "white",
                // Long titles stop at two lines.
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {due ? due.title : "Pay your dues securely"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            {["No account needed", "Instant receipt"].map((t) => (
              <span
                key={t}
                style={{
                  display: "flex",
                  borderRadius: 999,
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  padding: "10px 20px",
                  fontSize: 21,
                  fontWeight: 500,
                  color: "white",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* A ticket stub for the due — Duevy's receipt idea — with a mint one behind it. */}
        {due && (
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 420,
              marginRight: 56,
              paddingBottom: 60,
            }}
          >
            <div
              style={{
                position: "absolute",
                display: "flex",
                width: 330,
                height: 430,
                borderRadius: 30,
                background: C.mint,
                transform: "rotate(9deg) translate(34px, 6px)",
              }}
            />
            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                width: 340,
                height: 440,
                borderRadius: 30,
                background: C.canvas,
                transform: "rotate(-4deg)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "38px 36px 30px",
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: 2.5,
                    color: C.inkSoft,
                  }}
                >
                  AMOUNT
                </span>
                <span style={{ display: "flex", marginTop: 14 }}>
                  <OgNaira
                    kobo={due.amount}
                    size={shareNairaLength(due.amount) > 7 ? 54 : 66}
                    color={C.ink}
                  />
                </span>
                <span
                  style={{
                    marginTop: 12,
                    fontSize: 22,
                    fontWeight: 500,
                    color: C.inkSoft,
                  }}
                >
                  {CATEGORY_LABEL[due.type] ?? "Due"}
                </span>
              </div>

              {/* The tear line, with a notch cut from each side. */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  height: 40,
                }}
              >
                {/* The doodle's dark tone at this spot, so it reads as a hole. */}
                <Notch side="left" color="#033c36" />
                <span
                  style={{
                    display: "flex",
                    flex: 1,
                    margin: "0 34px",
                    borderTop: `3px dashed ${C.cloud}`,
                  }}
                />
                {/* Over the mint ticket behind, so it takes its colour. */}
                <Notch side="right" color={C.mint} />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "26px 36px 0",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: 2.5,
                    color: C.inkSoft,
                  }}
                >
                  DUE BY
                </span>
                <span
                  style={{
                    marginTop: 6,
                    fontSize: 26,
                    fontWeight: 700,
                    color: C.ink,
                  }}
                >
                  {shareDate(due.dueDate)}
                </span>
                {/* A barcode strip, drawn from the due id so each due's looks its own. */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 4,
                    height: 44,
                    marginTop: 22,
                  }}
                >
                  {barcode(dueId).map((w, i) => (
                    <span
                      key={i}
                      style={{
                        display: "flex",
                        width: w,
                        height: "100%",
                        background: i % 7 === 3 ? C.brand : C.ink,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    { ...size, fonts },
  );
}

/**
 * A half-circle bite out of the ticket's edge. It spills a few px past the
 * edge so it covers the ticket's anti-aliased rim (else a pale line shows).
 */
function Notch({ side, color }: { side: "left" | "right"; color: string }) {
  const spill = 4;
  return (
    <span
      style={{
        position: "absolute",
        [side]: -spill,
        display: "flex",
        width: 20 + spill,
        height: 40,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          position: "absolute",
          [side]: spill - 20,
          width: 40,
          height: 40,
          borderRadius: 999,
          background: color,
        }}
      />
    </span>
  );
}
