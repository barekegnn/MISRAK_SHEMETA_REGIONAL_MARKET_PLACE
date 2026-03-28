import { NextResponse } from "next/server";
import type { OrderStatus } from "@/types";
import { updateOrderForCurrentUser } from "@/lib/data/dashboard-operations";
import { handleApiError } from "@/lib/api/errors";

type OrderPatchBody = {
  action?:
    | "seller_dispatch"
    | "seller_lock"
    | "seller_resume"
    | "seller_fail"
    | "runner_claim"
    | "runner_release"
    | "runner_pickup"
    | "runner_complete"
    | "runner_lock"
    | "admin_update";
  otp?: string;
  status?: OrderStatus;
  runnerId?: string | null;
  adminNote?: string | null;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as OrderPatchBody | null;

    if (!body?.action) {
      return NextResponse.json({ error: "Order action is required." }, { status: 400 });
    }

    const result = await updateOrderForCurrentUser(id, {
      action: body.action,
      otp: body.otp,
      status: body.status,
      runnerId: body.runnerId,
      adminNote: body.adminNote,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "Unexpected order workflow error.");
  }
}
