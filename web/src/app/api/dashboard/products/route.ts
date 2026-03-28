import { NextResponse } from "next/server";
import type { ProductCategory } from "@/types";
import { createProductForCurrentSeller } from "@/lib/data/dashboard-operations";
import { handleApiError } from "@/lib/api/errors";

type ProductBody = {
  shopId?: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: ProductCategory;
  imageUrls?: string[];
  isActive?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProductBody | null;

    if (!body?.category) {
      return NextResponse.json({ error: "Product category is required." }, { status: 400 });
    }

    const result = await createProductForCurrentSeller({
      shopId: body.shopId ?? "",
      name: body.name ?? "",
      description: body.description ?? "",
      price: Number(body.price ?? 0),
      stock: Number(body.stock ?? 0),
      category: body.category,
      imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
      isActive: body.isActive ?? true,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "Unexpected product creation error.");
  }
}
