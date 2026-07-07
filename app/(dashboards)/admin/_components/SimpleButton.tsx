import * as React from "react";

import { Button } from "@/components/ui/button";

export function PrimaryActionButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      className={["bg-brand text-white hover:bg-brand/80", props.className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Button>
  );
}
