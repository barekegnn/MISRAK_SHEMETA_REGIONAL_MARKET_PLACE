import { Badge } from "@/components/ui/badge";
import { EmptyStateCard } from "@/components/dashboard/dashboard-ui";
import { LinkButton } from "@/components/ui/link-button";
import { EntityToggleButton } from "@/components/dashboard/entity-toggle-button";
import type { Product } from "@/types";

type Props = {
  products: Product[];
  emptyTitle: string;
  emptyDescription: string;
  emptyActionHref: string;
  emptyActionLabel: string;
};

export function SellerProductInventory({
  products,
  emptyTitle,
  emptyDescription,
  emptyActionHref,
  emptyActionLabel,
}: Props) {
  if (!products.length) {
    return (
      <EmptyStateCard
        title={emptyTitle}
        description={emptyDescription}
        actionHref={emptyActionHref}
        actionLabel={emptyActionLabel}
      />
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium text-[#1E1B4B]">{product.name}</p>
              <p className="mt-1 text-sm text-neutral-600">
                {product.shop?.name ?? "Unassigned shop"} ·{" "}
                {product.price.toLocaleString()} ETB
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {product.category} · Stock {product.stock}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={product.is_active ? "secondary" : "outline"}>
                {product.is_active ? "Live" : "Paused"}
              </Badge>
              <Badge variant={product.stock > 5 ? "outline" : "destructive"}>
                Stock: {product.stock}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <LinkButton href={`/merchant/products/${product.id}`} variant="outline" size="sm">
              Edit details
            </LinkButton>
            <EntityToggleButton
              endpoint={`/api/dashboard/products/${product.id}`}
              isActive={product.is_active}
              activeLabel="Pause listing"
              inactiveLabel="Publish listing"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
