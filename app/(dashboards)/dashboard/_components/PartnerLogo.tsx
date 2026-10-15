import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A partner's logo, or its short name on a brand chip when it has none.
 * `unoptimized` like poll photos, so a logo on any host renders.
 */
export function PartnerLogo({
  logoUrl,
  short,
  size = 40,
  className,
}: {
  logoUrl: string | null;
  short: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-cloud font-semibold text-brand",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.26)) }}
    >
      {logoUrl ? (
        <Image src={logoUrl} alt="" fill unoptimized className="object-cover" />
      ) : (
        short.slice(0, 4).toUpperCase()
      )}
    </span>
  );
}
