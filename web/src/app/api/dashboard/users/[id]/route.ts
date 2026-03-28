import { NextResponse } from "next/server";
import { updateUserForAdmin } from "@/lib/data/dashboard-operations";
import { handleApiError } from "@/lib/api/errors";
import type { DeliveryZone, UserRole } from "@/types";

const ROLES: UserRole[] = ["buyer", "seller", "runner", "admin"];

type UserPatchBody = {
  role?: UserRole;
  delivery_zone?: DeliveryZone | null;
};

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && ROLES.includes(value as UserRole);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UserPatchBody | null;

    const patch: Parameters<typeof updateUserForAdmin>[1] = {};

    if (body?.role !== undefined) {
      if (!isUserRole(body.role)) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }
      patch.role = body.role;
    }

    if (body?.delivery_zone !== undefined) {
      patch.delivery_zone = body.delivery_zone;
    }

    const result = await updateUserForAdmin(id, patch);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "Unexpected user update error.");
  }
}
