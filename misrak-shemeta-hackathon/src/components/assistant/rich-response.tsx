"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import type { AssistantResponse } from "@/types";
import { formatEtb } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function RichResponse({
  payload,
}: {
  payload: Pick<AssistantResponse, "answer" | "language" | "products" | "shops">;
}) {
  const { t } = useLocale();
  const ethiopic =
    payload.language === "am" || payload.language === "om";

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "max-w-none whitespace-pre-wrap text-sm text-brand-900 leading-relaxed",
          ethiopic && "font-ethiopic text-[15px]"
        )}
      >
        {payload.answer}
      </div>

      {payload.products.length > 0 && (
        <div className="space-y-3">
          {payload.products.map((p) => (
            <Card
              key={p.id}
              className="overflow-hidden border-brand-100 p-0 shadow-md"
            >
              <div className="flex gap-3 p-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-50">
                  <Image
                    src={p.image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized={p.image_url.startsWith("http")}
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold text-brand-950">{p.name}</p>
                  <p className="text-sm text-brand-700">
                    {formatEtb(p.price)} · {p.shop_name}
                  </p>
                  <a
                    href={`tel:${p.shop_phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent-600"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {p.shop_phone}
                  </a>
                  {p.delivery_fee != null && (
                    <p className="text-xs text-brand-500">
                      {t("productDetail.deliveryFee")}: {formatEtb(p.delivery_fee)}
                    </p>
                  )}
                  <Link
                    href={p.view_url}
                    className="inline-block text-sm font-semibold text-brand-600"
                  >
                    View product →
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {payload.shops.length > 0 && (
        <div className="grid gap-2">
          {payload.shops.map((s) => (
            <Card key={s.id} className="border-brand-100 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{s.name}</span>
                <Badge variant="secondary">{s.city}</Badge>
              </div>
              <a
                href={`tel:${s.phone.replace(/\s/g, "")}`}
                className="text-sm text-accent-600"
              >
                {s.phone}
              </a>
              {s.description && (
                <p className="mt-1 text-xs text-brand-600">{s.description}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
