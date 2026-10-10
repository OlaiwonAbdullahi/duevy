// Rebuilds public/banks/*.png and lib/banks/logo-files.ts from two MIT-licensed
// sources, first one wins for a bank both cover:
//   1. nigerianbanks.xyz (github.com/ichtrojan/nigerian-banks), fetched live
//      and snapshotted to docs/nigerianbanks.json;
//   2. docs/banks.json (Blockroll open-assets, assets/banks/nigeria.json).
// Every logo that downloads is resized to 96×96 PNG. Dead URLs and placeholder
// images (one picture shared by many banks) are skipped.
//
//   npm run banks:logos             # add --verbose to list what was skipped
//   npm run banks:logos -- --offline   # use the docs/nigerianbanks.json snapshot

import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { BANK_LOGO_ALIASES, normaliseBankName } from "../lib/banks/normalise.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public/banks");
const MAP_FILE = path.join(ROOT, "lib/banks/logo-files.ts");
const NB_API = "https://nigerianbanks.xyz/";
const NB_SNAPSHOT = path.join(ROOT, "docs/nigerianbanks.json");
const BLOCKROLL = path.join(ROOT, "docs/banks.json");
const SIZE = 96;
// An image shared by this many unrelated banks (different first word) is a
// "no logo" placeholder. Related entries (Zenith Bank / Zenith Mobile) may share one.
const PLACEHOLDER_MIN_SHARES = 3;
const verbose = process.argv.includes("--verbose");

const slug = (name) =>
  name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function download(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) return { error: `HTTP ${res.status}` };
      if (!(res.headers.get("content-type") ?? "").startsWith("image/")) return { error: "not an image" };
      return { body: Buffer.from(await res.arrayBuffer()) };
    } catch (err) {
      if (attempt === 3) return { error: err.name === "TimeoutError" ? "timed out" : err.message };
    }
  }
}

/** Run `fn` over `items` with at most `limit` in flight — the logo hosts throttle bursts. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

async function nigerianBanks() {
  if (!process.argv.includes("--offline")) {
    const res = await fetch(NB_API, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`${NB_API} returned ${res.status}`);
    const list = await res.json();
    await writeFile(NB_SNAPSHOT, `${JSON.stringify(list, null, 2)}\n`);
    return list;
  }
  return JSON.parse(await readFile(NB_SNAPSHOT, "utf8"));
}

const sources = [
  { label: "nigerianbanks.xyz", banks: await nigerianBanks() },
  { label: "Blockroll", banks: JSON.parse(await readFile(BLOCKROLL, "utf8")).banks },
];

// Download everything first, so placeholders can be spotted across all banks.
const entries = [];
for (const source of sources) {
  const fetched = await mapLimit(source.banks, 8, async (bank) => ({
    source: source.label,
    bank,
    ...(bank.logo ? await download(bank.logo) : { error: "no logo URL" }),
  }));
  entries.push(...fetched);
}

const hashOf = (body) => createHash("sha1").update(body).digest("hex");
const firstWord = (name) => normaliseBankName(name).split(" ")[0] ?? "";
const shares = new Map(); // image hash → first words of the banks using it
for (const e of entries) {
  if (!e.body) continue;
  const h = hashOf(e.body);
  shares.set(h, (shares.get(h) ?? new Set()).add(firstWord(e.bank.name)));
}

await mkdir(OUT_DIR, { recursive: true });
const byCode = new Map();
const byName = new Map();
const files = new Set();
const skipped = [];

for (const { source, bank, body, error } of entries) {
  const why = error ?? (shares.get(hashOf(body)).size >= PLACEHOLDER_MIN_SHARES ? "placeholder image" : null);
  if (why) {
    skipped.push(`[${source}] ${bank.code} ${bank.name}: ${why}`);
    continue;
  }
  const key = normaliseBankName(bank.name);
  const code = String(bank.code ?? "").trim();
  const newCode = code && !byCode.has(code);
  const newName = key && !byName.has(key);
  if (!newCode && !newName) continue; // an earlier source already covers this bank
  if (!newName) {
    // Same bank under another code scheme (e.g. NIP 000014 vs CBN 044): reuse its logo.
    byCode.set(code, byName.get(key));
    continue;
  }

  let file = slug(bank.name);
  if (files.has(file)) file = `${file}-${code || files.size}`;
  try {
    const png = await sharp(body)
      .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    await writeFile(path.join(OUT_DIR, `${file}.png`), png);
  } catch (err) {
    skipped.push(`[${source}] ${bank.code} ${bank.name}: unreadable image (${err.message})`);
    continue;
  }
  files.add(file);
  if (newCode) byCode.set(code, file);
  if (newName) byName.set(key, file);
}

// Remove logos no longer produced (licence files and anything else stay).
for (const name of await readdir(OUT_DIR)) {
  if (name.endsWith(".png") && !files.has(name.slice(0, -4))) await rm(path.join(OUT_DIR, name));
}

const missingAliases = [];
for (const [fragment, file] of BANK_LOGO_ALIASES) {
  try {
    await access(path.join(OUT_DIR, `${file}.png`));
  } catch {
    missingAliases.push(`"${fragment}" → ${file}.png`);
  }
}

const literal = (map) =>
  [...map]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join("\n");

await writeFile(
  MAP_FILE,
  `// Generated by scripts/sync-bank-logos.mjs — do not edit; run \`npm run banks:logos\`.
// Sources (MIT): nigerianbanks.xyz (ichtrojan/nigerian-banks), then Blockroll
// open-assets (docs/banks.json). Values are files in public/banks/ (no .png).

/** Bank code (as the source lists it) → logo file. */
export const BANK_LOGO_BY_CODE: Record<string, string> = {
${literal(byCode)}
};

/** normaliseBankName(name) → logo file. */
export const BANK_LOGO_BY_NAME: Record<string, string> = {
${literal(byName)}
};
`,
);

console.log(
  `${files.size} logos in public/banks/ (${byCode.size} codes, ${byName.size} names); skipped ${skipped.length}.`,
);
if (verbose) console.log(skipped.map((s) => `  - ${s}`).join("\n"));
if (missingAliases.length) {
  console.error(`Aliases in lib/banks/normalise.ts point at missing files:\n  ${missingAliases.join("\n  ")}`);
  process.exitCode = 1;
}
