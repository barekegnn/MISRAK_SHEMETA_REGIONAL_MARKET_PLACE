import { NextResponse } from "next/server";
import { updateShopForAdmin } from "@/lib/data/dashboard-operations";
import { handleApiError } from "@/lib/api/errors";

type ShopPatchBody = {
  isActive?: boolean;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as ShopPatchBody | null;

    if (typeof body?.isActive !== "boolean") {
      return NextResponse.json({ error: "Shop active state is required." }, { status: 400 });
    }

    const result = await updateShopForAdmin(id, body.isActive);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "Unexpected shop moderation error.");
  }
}
