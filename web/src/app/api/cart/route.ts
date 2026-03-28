import { NextResponse } from "next/server";
import type { CartItem } from "@/types";
import { sanitizeCartItems } from "@/lib/cart/shared";
import {
  CartDataError,
  clearAccountCartForCurrentUser,
  getAccountCartForCurrentUser,
  mergeAccountCartForCurrentUser,
  replaceAccountCartForCurrentUser,
} from "@/lib/data/cart";

export async function GET() {
  try {
    const items = await getAccountCartForCurrentUser();
    return NextResponse.json({ items });
  } catch (error) {
    return handleCartError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: CartItem[] } | null;
    const items = await mergeAccountCartForCurrentUser(
      sanitizeCartItems(body?.items ?? []),
    );

    return NextResponse.json({ items });
  } catch (error) {
    return handleCartError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { items?: CartItem[] } | null;
    const items = await replaceAccountCartForCurrentUser(
      sanitizeCartItems(body?.items ?? []),
    );

    return NextResponse.json({ items });
  } catch (error) {
    return handleCartError(error);
  }
}

export async function DELETE() {
  try {
    const items = await clearAccountCartForCurrentUser();
    return NextResponse.json({ items });
  } catch (error) {
    return handleCartError(error);
  }
}

function handleCartError(error: unknown) {
  if (error instanceof CartDataError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json(
    { error: "Unexpected cart error." },
    { status: 500 },
  );
}
