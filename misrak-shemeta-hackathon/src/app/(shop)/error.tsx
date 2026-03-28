"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="font-display text-xl font-bold text-brand-950">
        Something went wrong
      </h1>
      <p className="text-sm text-brand-700">{error.message}</p>
      <Button type="button" className="rounded-xl" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
