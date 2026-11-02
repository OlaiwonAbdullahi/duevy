"use client";

import Link from "next/link";
import { ReceiptTextIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { useRole } from "../../_components/role-context";
import { SettingsCard } from "./SettingsCard";

/** Reps only: a way into the receipt design page (from Settings and Manage dept.), which isn't in the sidebar. */
export function ReceiptDesignCard() {
  const { isRep } = useRole();
  if (!isRep) return null;

  return (
    <SettingsCard
      icon={ReceiptTextIcon}
      title="Receipt design"
      description="Put your logo, colours and signature on the receipts your payers get."
    >
      <Button asChild variant="brand-outline" size="pill" className="max-sm:w-full">
        <Link href="/dashboard/receipt-design">Customise receipts</Link>
      </Button>
    </SettingsCard>
  );
}
