"use client";

import { useState } from "react";

/**
 * The `/banks` endpoint carries no logo, so we resolve one from logo.dev (a
 * licensed logo API) keyed by a curated bank→domain map. Requires
 * `NEXT_PUBLIC_LOGO_DEV_TOKEN` — without it (or for an unknown bank, or if the
 * image fails to load) we render an initials monogram instead.
 *
 * NOTE: `NEXT_PUBLIC_*` env vars are inlined at build time — after adding the
 * token you must restart the dev server for logos to appear.
 */

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;

/**
 * Fragment of a (lowercased) bank name → its web domain. First match wins, so
 * more specific keys come first. Every domain here is verified to return a logo
 * from logo.dev; unmapped banks (mostly tiny MFBs with no web presence) render
 * the initials monogram.
 */
const BANK_DOMAINS: Record<string, string> = {
  // Commercial & merchant banks
  "guaranty trust": "gtbank.com",
  gtbank: "gtbank.com",
  "gt mobile": "gtbank.com",
  gtco: "gtbank.com",
  access: "accessbankplc.com",
  zenith: "zenithbank.com",
  "first city monument": "fcmb.com",
  fcmb: "fcmb.com",
  "first bank": "firstbanknigeria.com",
  firstmonie: "firstbanknigeria.com",
  "united bank for africa": "ubagroup.com",
  fidelity: "fidelitybank.ng",
  "union bank": "unionbankng.com",
  sterling: "sterling.ng",
  stanbic: "stanbicibtc.com",
  wema: "wemabank.com",
  alat: "wemabank.com",
  "polaris bank": "polarisbanklimited.com",
  keystone: "keystonebankng.com",
  ecobank: "ecobank.com",
  heritage: "hbng.com",
  "unity bank": "unitybankng.com",
  providus: "providusbank.com",
  jaiz: "jaizbankplc.com",
  globus: "globusbank.com",
  titan: "titantrustbank.com",
  citibank: "citibank.com",
  "standard chartered": "sc.com",
  lotus: "lotusbank.com",
  taj: "tajbank.com",
  "premium trust": "premiumtrustbank.com",
  optimus: "optimusbank.com",
  parallex: "parallexbank.com",
  suntrust: "suntrustng.com",
  "signature bank": "signaturebankng.com",
  coronation: "coronationmb.com",
  fbnquest: "fbnquest.com",
  "rand merchant": "rmb.com.ng",
  greenwich: "greenwichmerchantbank.com",
  nova: "novambl.com",
  fsdh: "fsdhgroup.com",
  // Payment service banks & fintechs
  opay: "opayweb.com",
  paycom: "opayweb.com",
  palmpay: "palmpay.com",
  moniepoint: "moniepoint.com",
  kuda: "kuda.com",
  "v bank": "vbank.ng",
  vfd: "vbank.ng",
  sparkle: "sparkle.ng",
  carbon: "getcarbon.co",
  fairmoney: "fairmoney.io",
  renmoney: "renmoney.com",
  eyowo: "eyowo.com",
  rubies: "rubies.ng",
  prospa: "getprospa.com",
  "mint microfinance": "mintyn.com",
  paga: "mypaga.com",
  paystack: "paystack.com",
  flutterwave: "flutterwave.com",
  cellulant: "cellulant.io",
  "branch international": "branch.co",
  fets: "fets.ng",
  smartcash: "smartcashpsb.com",
  momo: "momopsb.com",
  moneymaster: "moneymasterpsb.com",
  hope: "hopepsbank.com",
  "9 payment": "9psb.com.ng",
  // Microfinance banks with a web presence
  lapo: "lapo-nigeria.org",
  letshego: "letshego.com",
  baobab: "baobab.ng",
  accion: "accionmfb.com",
  "ab microfinance": "ab-mfbnigeria.com",
  nirsal: "nirsalmfb.com",
  npf: "npfmicrofinancebank.com",
  hasal: "hasalmfb.com",
  ibile: "ibilemfb.com",
  aella: "aella.co",
  "78 finance": "bank78.co",
  "9japay": "9japay.com",
  bankly: "bankly.ng",
  fortis: "fortismfb.com",
  "abu microfinance": "abumfbank.com.ng",
  "above only": "aboveonlymfb.com",
  "ada microfinance": "adamicrofinancebank.com",
  addosser: "addosserfinance.com",
  "adeyemi college": "acsmfb.com",
  advancly: "advancly.com",
};

function domainFor(name: string): string | null {
  const n = name.toLowerCase();
  for (const key in BANK_DOMAINS) {
    if (n.includes(key)) return BANK_DOMAINS[key];
  }
  return null;
}

function logoUrl(domain: string): string | null {
  if (!LOGO_DEV_TOKEN) return null;
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=64&format=png`;
}

/** Monogram initials for a bank — the fallback mark when no logo is available. */
export function bankInitials(name: string): string {
  const words = name
    .replace(/\b(bank|limited|ltd|plc|microfinance|mfb|nigeria|company)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const initials = words.slice(0, 2).map((w) => w[0]).join("");
  return (initials || name.slice(0, 2)).toUpperCase();
}

function BankMark({ name, className }: { name: string; className: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-cloud text-[10px] font-bold text-brand ${className}`}
      aria-hidden
    >
      {bankInitials(name)}
    </span>
  );
}

export function BankLogo({ name, className = "" }: { name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const domain = domainFor(name);
  const url = domain ? logoUrl(domain) : null;

  if (!url || failed) return <BankMark name={name} className={className} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full bg-white object-contain ${className}`}
    />
  );
}
