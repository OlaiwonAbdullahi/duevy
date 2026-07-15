"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DangerCard } from "../../_components/DangerCard";
import { DeleteAccountModal } from "./DeleteAccountModal";

/** Destructive account actions, in the shared rose danger shell. */
export function DangerZone() {
  const [open, setOpen] = useState(false);

  return (
    <DangerCard
      title="Deactivate account"
      description="Your profile is hidden and you stop receiving reminders. You can reactivate any time by signing back in. Outstanding dues remain payable."
    >
      <Button variant="danger-outline" size="pill-lg" onClick={() => setOpen(true)}>
        Deactivate account
      </Button>

      {open && <DeleteAccountModal onClose={() => setOpen(false)} />}
    </DangerCard>
  );
}
