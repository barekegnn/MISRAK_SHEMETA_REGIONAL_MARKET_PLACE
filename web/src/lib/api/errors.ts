import { NextResponse } from "next/server";
import { DashboardOperationError } from "@/lib/data/dashboard-operations";
import { CartDataError } from "@/lib/data/cart";

export function handleApiError(error: unknown, fallbackMessage = "Unexpected request error.") {
  if (error instanceof DashboardOperationError || error instanceof CartDataError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
