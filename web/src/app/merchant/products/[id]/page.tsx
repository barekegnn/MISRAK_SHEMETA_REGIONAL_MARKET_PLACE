import { notFound } from "next/navigation";
import { DashboardShell, SectionCard } from "@/components/dashboard/dashboard-ui";
import { LinkButton } from "@/components/ui/link-button";
import { requireRole } from "@/lib/auth/server";
import { getSellerDashboardData } from "@/lib/data/marketplace";
import { MerchantProductForm } from "../product-form";

export default async function EditMerchantProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await requireRole(["seller"]);
  const data = await getSellerDashboardData(seller.id);
  const product = data.products.find((entry) => entry.id === id);

  if (!product) {
    notFound();
  }

  return (
    <DashboardShell
      eyebrow="Seller catalog"
      title={`Edit ${product.name}`}
      description="Update price, stock, publication state, and storefront placement for this product."
      actions={
        <LinkButton href="/merchant/products" variant="outline">
          Back to products
        </LinkButton>
      }
    >
      <SectionCard
        title="Product settings"
        description="Save inventory changes here, then return to the catalog list for quick moderation."
      >
        <MerchantProductForm mode="edit" shops={data.shops} product={product} />
      </SectionCard>
    </DashboardShell>
  );
}
