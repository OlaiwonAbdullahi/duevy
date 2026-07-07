import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { CreditCardIcon } from "@hugeicons/core-free-icons";
import { CARD_LOGOS } from "./utils";

/** A card's brand logo in a white chip, falling back to a generic icon. */
export function CardBrand({ brand }: { brand: string }) {
  const src = CARD_LOGOS[brand];
  return (
    <span className="grid h-10 w-14 shrink-0 place-items-center rounded-xl bg-white">
      {src ? (
        <span className="relative h-6 w-10">
          <Image src={src} alt={brand} fill unoptimized className="object-contain" />
        </span>
      ) : (
        <HugeiconsIcon icon={CreditCardIcon} size={20} className="text-[#1b2520]" />
      )}
    </span>
  );
}
