import { NextResponse } from "next/server";
import type { ProductCategory } from "@/types";
import { updateProductForCurrentUser } from "@/lib/data/dashboard-operations";
import { handleApiError } from "@/lib/api/errors";

type ProductPatchBody = {
  shopId?: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: ProductCategory;
  imageUrls?: string[];
  isActive?: boolean;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as ProductPatchBody | null;
    const result = await updateProductForCurrentUser(id, {
      shopId: body?.shopId,
      name: body?.name,
      description: body?.description,
      price: body?.price !== undefined ? Number(body.price) : undefined,
      stock: body?.stock !== undefined ? Number(body.stock) : undefined,
      category: body?.category,
      imageUrls: Array.isArray(body?.imageUrls) ? body.imageUrls : undefined,
      isActive: body?.isActive,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "Unexpected product update error.");
  }
}
