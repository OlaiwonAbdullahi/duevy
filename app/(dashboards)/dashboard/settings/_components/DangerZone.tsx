"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DangerCard } from "../../_components/DangerCard";

/** Destructive account actions, in the shared rose danger shell. */
export function DangerZone() {
  return (
    <DangerCard
      title="Deactivate account"
      description="Your profile is hidden and you stop receiving reminders. You can reactivate any time by signing back in. Outstanding dues remain payable."
    >
      <Button
        variant="danger-outline"
        size="pill-lg"
        onClick={() =>
          toast("Deactivate account?", {
            description: "This would open a confirmation step in production.",
          })
        }
      >
        Deactivate account
      </Button>
    </DangerCard>
  );
}
