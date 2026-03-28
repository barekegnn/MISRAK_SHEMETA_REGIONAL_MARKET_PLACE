import { notFound } from "next/navigation";
import { getProductById } from "@/lib/data/marketplace";
import { ProductDetailView } from "./product-detail";

type Params = Promise<{ id: string }>;

export default async function ProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();
  return <ProductDetailView product={product} />;
}
