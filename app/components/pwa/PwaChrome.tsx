"use client";

import dynamic from "next/dynamic";

// Both only matter after hydration (connectivity + install prompt), so keep
// them out of the initial bundle for every route.
const NetworkIndicator = dynamic(
  () => import("./NetworkIndicator").then((mod) => mod.NetworkIndicator),
  { ssr: false },
);
const InstallBanner = dynamic(
  () => import("./InstallBanner").then((mod) => mod.InstallBanner),
  { ssr: false },
);

export function PwaChrome() {
  return (
    <>
      <NetworkIndicator />
      <InstallBanner />
    </>
  );
}
