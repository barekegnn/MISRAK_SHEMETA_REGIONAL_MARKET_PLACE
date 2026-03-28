import { MapPin, Phone, Store } from "lucide-react";
import type { Shop } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";

type ShopCardProps = {
  shop: Shop;
  productCount: number;
};

export function ShopCard({ shop, productCount }: ShopCardProps) {
  return (
    <Card className="h-full border-neutral-200 bg-white shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-full bg-indigo-50 p-2 text-[#4F46E5]">
            <Store className="size-5" />
          </div>
          <Badge variant="outline">{shop.category}</Badge>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-lg text-[#1E1B4B]">{shop.name}</CardTitle>
          <CardDescription className="flex items-center gap-1 text-sm">
            <MapPin className="size-4" />
            {shop.city.replace("_", " ")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-3 text-sm leading-relaxed text-neutral-600">
          {shop.description}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span className="rounded-full bg-neutral-100 px-2 py-1 font-medium text-neutral-700">
            {productCount} {productCount === 1 ? "product" : "products"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Phone className="size-3.5" />
            {shop.phone}
          </span>
        </div>
      </CardContent>
      <CardFooter className="mt-auto bg-transparent">
        <LinkButton
          href={`/shops/${shop.id}`}
          className="w-full bg-[#4F46E5] hover:bg-[#4338CA]"
        >
          View shop
        </LinkButton>
      </CardFooter>
    </Card>
  );
}
