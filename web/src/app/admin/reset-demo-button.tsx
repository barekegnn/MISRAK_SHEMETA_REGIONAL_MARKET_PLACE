"use client";

import { Button } from "@/components/ui/button";
import { clearStoredCartItems } from "@/lib/cart/shared";
import { clearDemoOrders } from "@/lib/demo-payments";
import { toast } from "sonner";

export function ResetDemoButton() {
  return (
    <Button
      variant="outline"
      onClick={() => {
        clearDemoOrders();
        clearStoredCartItems();

        toast.success("Local demo checkout data cleared on this browser.");
      }}
    >
      Reset Demo
    </Button>
  );
}
