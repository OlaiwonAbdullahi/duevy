import { OG_COLORS as C, OG_SIZE, ogAssets, ogJpeg } from "@/lib/og";

export const alt = "Duevy — Payment infra for every Campus.";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

/** The share card every page uses unless it has its own (pay links do). */
export default async function OpengraphImage() {
  const { doodle, logo } = await ogAssets();

  return ogJpeg(
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
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "56px 72px",
        }}
      >
        <img src={logo} alt="" height={52} width={181} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 80,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2.5,
              color: "white",
            }}
          >
            <span>Payment infra for</span>
            <span style={{ color: C.mint }}>every Campus.</span>
          </div>
          <p
            style={{
              marginTop: 30,
              fontSize: 26,
              fontWeight: 500,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.78)",
              maxWidth: 820,
            }}
          >
            Duevy gives campus reps a clean way to collect dues, and gives
            every student a receipt for every naira.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              display: "flex",
              borderRadius: 999,
              background: "white",
              color: C.deep,
              padding: "12px 26px",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            duevy.app
          </span>
        </div>
      </div>
    </div>,
    "public, max-age=86400, stale-while-revalidate=604800",
  );
}
