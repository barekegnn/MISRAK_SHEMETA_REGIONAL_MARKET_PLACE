import { NextResponse } from "next/server";
import type { DeliveryZone, Language } from "@/types";
import { updateProfileForCurrentUser } from "@/lib/data/dashboard-operations";
import { handleApiError } from "@/lib/api/errors";

type ProfileBody = {
  fullName?: string;
  phone?: string;
  deliveryZone?: DeliveryZone;
  language?: Language;
};

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as ProfileBody | null;

    if (!body?.deliveryZone || !body.language) {
      return NextResponse.json(
        { error: "Delivery zone and language are required." },
        { status: 400 },
      );
    }

    const result = await updateProfileForCurrentUser({
      fullName: body.fullName ?? "",
      phone: body.phone ?? "",
      deliveryZone: body.deliveryZone,
      language: body.language,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "Unexpected profile update error.");
  }
}
