"use client";

import Image from "next/image";
import type { AssistantResponse } from "@/types";
import { Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";

type Props = {
  data: AssistantResponse;
  className?: string;
};

export function RichResponse({ data, className }: Props) {
  const isAm = data.language === "am";

  return (
    <div className={cn("space-y-3", className)}>
      <p
        className={cn(
          "whitespace-pre-wrap text-sm leading-relaxed text-neutral-800",
          isAm && "font-ethiopic",
        )}
      >
        {data.answer}
      </p>
      {data.products.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {data.products.map((p) => (
            <Card key={p.id} className="overflow-hidden border-neutral-200">
              <CardContent className="flex gap-3 p-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="line-clamp-2 text-sm font-semibold leading-tight">
                    {p.name}
                  </p>
                  <p className="text-sm font-bold text-[#4F46E5]">
                    {p.price.toLocaleString()} ETB
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {p.shop_name} · {p.shop_city.replace("_", " ")}
                  </p>
                  {p.delivery_fee != null ? (
                    <p className="text-xs text-neutral-600">
                      🚚 Delivery from {p.delivery_fee} ETB
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={`tel:${p.shop_phone}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-8",
                      )}
                    >
                      <Phone className="mr-1 size-3" />
                      Call
                    </a>
                    <LinkButton
                      href={p.view_url}
                      size="sm"
                      className="h-8 bg-[#4F46E5]"
                    >
                      View product
                    </LinkButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
