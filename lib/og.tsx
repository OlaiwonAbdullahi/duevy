import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import sharp from "sharp";

/**
 * Shared pieces for the share cards (`opengraph-image.tsx` routes): the size
 * every platform crops well, the brand colours, Manrope, and the doodle and
 * logo inlined as data URLs (the renderer can't fetch relative paths).
 */

export const OG_SIZE = { width: 1200, height: 630 };

export const OG_COLORS = {
  deep: "#08583f",
  brand: "#0b6e4f",
  mint: "#9fe0c4",
  cloud: "#e6f2ec",
  canvas: "#fbfaf7",
  ink: "#1b2520",
  inkSoft: "#7a847f",
};

async function publicDataUrl(file: string, type: string) {
  const bytes = await readFile(join(process.cwd(), "public", file));
  return `data:${type};base64,${bytes.toString("base64")}`;
}

/** The doodle artwork and the white Duevy logo, ready for `<img src>`. Read once per server. */
let assets: Promise<{ doodle: string; logo: string }> | null = null;
export function ogAssets() {
  return (assets ??= loadAssets());
}

async function loadAssets() {
  const [doodle, logo] = await Promise.all([
    publicDataUrl("doodle-card.jpg", "image/jpeg"),
    publicDataUrl("logos/duevy-logo-white.png", "image/png"),
  ]);
  return { doodle, logo };
}

/**
 * Manrope 500 and 700, read from lib/og-fonts (Fontsource's latin and
 * latin-ext subsets; latin-ext carries the naira sign). Shipped with the app
 * so a card never waits on Google Fonts.
 */
let fonts: ReturnType<typeof loadFonts> | null = null;
export function ogFonts() {
  return (fonts ??= loadFonts());
}

async function loadFonts() {
  const dir = join(process.cwd(), "lib", "og-fonts");
  const load = (file: string) => readFile(join(dir, file));
  const files = [
    ["manrope-latin-500.woff", 500],
    ["manrope-latin-ext-500.woff", 500],
    ["manrope-latin-700.woff", 700],
    ["manrope-latin-ext-700.woff", 700],
  ] as const;
  return Promise.all(
    files.map(async ([file, weight]) => ({
      name: "Manrope",
      data: await load(file),
      weight,
      style: "normal" as const,
    })),
  );
}

/**
 * "₦2,500" at `size` px. Manrope (as Google serves it) has no naira sign, so
 * it's drawn: an N with two bars across.
 */
export function OgNaira({
  kobo,
  size,
  color,
}: {
  kobo: number;
  size: number;
  color: string;
}) {
  const digits = (kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: kobo % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  });
  const bar = {
    position: "absolute" as const,
    left: -size * 0.06,
    width: size * 0.82,
    height: Math.max(2, size * 0.07),
    background: color,
  };
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        fontSize: size,
        fontWeight: 700,
        letterSpacing: -size * 0.03,
        color,
        lineHeight: 1,
      }}
    >
      <span
        style={{
          position: "relative",
          display: "flex",
          marginRight: size * 0.04,
        }}
      >
        N
        <span style={{ ...bar, top: size * 0.36 }} />
        <span style={{ ...bar, top: size * 0.52 }} />
      </span>
      {digits}
    </span>
  );
}

/**
 * Render a card and send it as a JPEG: the doodle's fine texture makes the
 * PNG ~215 KB, slow for WhatsApp and the like to fetch after the text has
 * arrived; as a JPEG it's a fraction of that. `cacheControl` lets the CDN and
 * the apps keep it rather than ask for it again.
 */
export async function ogJpeg(element: ReactElement, cacheControl: string) {
  const png = await new ImageResponse(element, { ...OG_SIZE, fonts: await ogFonts() }).arrayBuffer();
  const jpeg = await sharp(Buffer.from(png)).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": cacheControl },
  });
}
