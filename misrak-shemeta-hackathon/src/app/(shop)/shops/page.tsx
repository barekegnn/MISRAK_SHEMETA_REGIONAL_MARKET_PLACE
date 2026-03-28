import { Suspense } from "react";
import { ShopsBrowserClient } from "./shops-browser-client";

function ShopsFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-2/3 max-w-md rounded-xl bg-brand-100" />
      <div className="h-24 rounded-2xl bg-brand-100/80" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[300px] rounded-2xl bg-brand-50" />
        ))}
      </div>
    </div>
  );
}

export default function ShopsPage() {
  return (
    <Suspense fallback={<ShopsFallback />}>
      <ShopsBrowserClient />
    </Suspense>
  );
}
