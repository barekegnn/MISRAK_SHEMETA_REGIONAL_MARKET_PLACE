import { NextResponse } from "next/server";
import type { CartItem, DeliveryZone, PaymentProvider } from "@/types";
import { sanitizeCartItems } from "@/lib/cart/shared";
import {
  CartDataError,
  createCheckoutOrdersForCurrentUser,
} from "@/lib/data/cart";

type CheckoutRequestBody = {
  provider?: PaymentProvider;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryZone?: DeliveryZone;
  items?: CartItem[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequestBody | null;
    const provider = body?.provider;

    if (provider !== "chapa" && provider !== "mpesa") {
      return NextResponse.json(
        { error: "Choose a valid payment provider." },
        { status: 400 },
      );
    }

    if (!body?.deliveryZone) {
      return NextResponse.json(
        { error: "Delivery zone is required." },
        { status: 400 },
      );
    }

    const result = await createCheckoutOrdersForCurrentUser({
      provider,
      customerName: body.customerName ?? "",
      customerPhone: body.customerPhone ?? "",
      customerEmail: body.customerEmail,
      deliveryZone: body.deliveryZone,
      items: sanitizeCartItems(body.items ?? []),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CartDataError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Unexpected checkout error." },
      { status: 500 },
    );
  }
}
