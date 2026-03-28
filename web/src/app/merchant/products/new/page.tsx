import {
  DashboardShell,
  EmptyStateCard,
  SectionCard,
} from "@/components/dashboard/dashboard-ui";
import { LinkButton } from "@/components/ui/link-button";
import { requireRole } from "@/lib/auth/server";
import { getSellerDashboardData } from "@/lib/data/marketplace";
import { MerchantProductForm } from "../product-form";

export default async function NewProductPage() {
  const seller = await requireRole(["seller"]);
  const data = await getSellerDashboardData(seller.id);

  return (
    <DashboardShell
      eyebrow="Seller catalog"
      title="Create product"
      description="Add a new product to one of your storefronts and publish it straight into the seller workspace."
      actions={
        <LinkButton href="/merchant/products" variant="outline">
          Back to products
        </LinkButton>
      }
    >
      {data.shops.length ? (
        <SectionCard
          title="New catalog item"
          description="Fill in the core product details, pricing, stock, and storefront assignment."
        >
          <MerchantProductForm mode="create" shops={data.shops} />
        </SectionCard>
      ) : (
        <EmptyStateCard
          title="Create a seller storefront first"
          description="This seller account does not own any storefront records yet, so there is nowhere to publish new catalog items."
          actionHref="/merchant"
          actionLabel="Open seller dashboard"
        />
      )}
    </DashboardShell>
  );
}
