import "server-only";

import { revalidatePath } from "next/cache";
import { PRODUCT_CATEGORIES, DELIVERY_ZONES } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getDashboardRoute, mapSupabaseUser } from "@/lib/auth/shared";
import type {
  DeliveryZone,
  Language,
  OrderStatus,
  ProductCategory,
  User,
  UserRole,
} from "@/types";

type Row = Record<string, unknown>;

type ProfileInput = {
  fullName: string;
  phone: string;
  deliveryZone: DeliveryZone;
  language: Language;
};

type ProductInput = {
  shopId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  imageUrls: string[];
  isActive: boolean;
};

type ProductPatch = Partial<{
  shop_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  images: string[];
  is_active: boolean;
}>;

type OrderActionInput = {
  action:
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

type SupabaseContext = {
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>;
  user: User;
};

const PRODUCT_CATEGORY_SET = new Set<ProductCategory>(
  PRODUCT_CATEGORIES.filter((value): value is ProductCategory => value !== "All"),
);
const DELIVERY_ZONE_SET = new Set<DeliveryZone>(DELIVERY_ZONES.map((zone) => zone.value));
const USER_ROLE_SET = new Set<UserRole>(["buyer", "seller", "runner", "admin"]);
const LANGUAGE_SET = new Set<Language>(["en", "am", "om"]);
const ORDER_STATUS_SET = new Set<OrderStatus>([
  "PENDING",
  "PAID_ESCROW",
  "DISPATCHED",
  "COMPLETED",
  "FAILED",
  "LOCKED",
]);

export class DashboardOperationError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "DashboardOperationError";
    this.status = status;
  }
}

export async function updateProfileForCurrentUser(input: ProfileInput) {
  const context = await requireSessionUser();
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();

  if (!DELIVERY_ZONE_SET.has(input.deliveryZone)) {
    throw new DashboardOperationError("Choose a valid delivery zone.", 400);
  }

  if (!LANGUAGE_SET.has(input.language)) {
    throw new DashboardOperationError("Choose a valid language.", 400);
  }

  const { error: authError } = await context.supabase.auth.updateUser({
    data: {
      full_name: fullName || null,
      phone: phone || null,
      delivery_zone: input.deliveryZone,
      language: input.language,
      role: context.user.role,
    },
  });

  if (authError) {
    throw new DashboardOperationError(authError.message, 400);
  }

  const { error: profileError } = await context.supabase
    .from("users")
    .update({
      full_name: fullName || null,
      phone: phone || null,
      delivery_zone: input.deliveryZone,
      language: input.language,
    })
    .eq("id", context.user.id);

  if (profileError && !profileError.message.toLowerCase().includes("relation")) {
    throw new DashboardOperationError(profileError.message);
  }

  revalidatePath("/account");
  revalidatePath(getDashboardRoute(context.user.role));

  return { message: "Account settings saved." };
}

export async function createProductForCurrentSeller(input: ProductInput) {
  const context = await requireSessionUser();
  ensureRole(context.user, ["seller"]);
  const payload = validateProductInput(input);

  await requireOwnedShop(context, payload.shop_id);

  const { data, error } = await context.supabase
    .from("products")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    throw new DashboardOperationError(error?.message ?? "Unable to create product.");
  }

  revalidateProductViews(data.id as string);

  return {
    message: "Product created and added to your catalog.",
    productId: String(data.id),
  };
}

export async function updateProductForCurrentUser(productId: string, input: Partial<ProductInput>) {
  const context = await requireSessionUser();
  if (!productId.trim()) {
    throw new DashboardOperationError("Product ID is required.", 400);
  }

  if (!["seller", "admin"].includes(context.user.role)) {
    throw new DashboardOperationError("Only sellers and admins can update products.", 403);
  }

  const currentProduct = await getSingleRow(context, "products", productId, "Product");
  if (context.user.role === "seller") {
    await requireOwnedShop(context, toString(currentProduct.shop_id));
  }

  const patch = buildProductPatch(input);
  if (!Object.keys(patch).length) {
    throw new DashboardOperationError("Provide at least one product field to update.", 400);
  }

  if (patch.shop_id && context.user.role === "seller") {
    await requireOwnedShop(context, patch.shop_id);
  }

  const { error } = await context.supabase
    .from("products")
    .update(patch)
    .eq("id", productId);

  if (error) {
    throw new DashboardOperationError(error.message);
  }

  revalidateProductViews(productId);

  return { message: "Product changes saved." };
}

type AdminUserPatch = Partial<{
  role: UserRole;
  delivery_zone: DeliveryZone | null;
}>;

export async function updateUserForAdmin(targetUserId: string, input: AdminUserPatch) {
  const context = await requireSessionUser();
  ensureRole(context.user, ["admin"]);

  const id = targetUserId.trim();
  if (!id) {
    throw new DashboardOperationError("User ID is required.", 400);
  }

  if (input.role != null && id === context.user.id) {
    throw new DashboardOperationError("Another admin must change your own platform role.", 400);
  }

  const row = await getSingleRow(context, "users", id, "User");
  const currentRole = rowRole(row.role);
  const nextRole = input.role ?? currentRole;

  if (input.role != null && !USER_ROLE_SET.has(input.role)) {
    throw new DashboardOperationError("Choose a valid account role.", 400);
  }

  let nextZone: DeliveryZone | null =
    input.delivery_zone !== undefined
      ? input.delivery_zone
      : normalizeDeliveryZone(row.delivery_zone);

  if (input.delivery_zone !== undefined && input.delivery_zone != null && !DELIVERY_ZONE_SET.has(input.delivery_zone)) {
    throw new DashboardOperationError("Choose a valid delivery zone.", 400);
  }

  if (nextRole === "runner" && !nextZone) {
    throw new DashboardOperationError("Runner accounts need a delivery zone before saving.", 400);
  }

  const dbPatch: Record<string, unknown> = {};
  if (input.role != null) {
    dbPatch.role = input.role;
  }
  if (input.delivery_zone !== undefined) {
    dbPatch.delivery_zone = input.delivery_zone;
  }

  if (!Object.keys(dbPatch).length) {
    throw new DashboardOperationError("Provide a role or delivery zone update.", 400);
  }

  const { error } = await context.supabase.from("users").update(dbPatch).eq("id", id);

  if (error) {
    throw new DashboardOperationError(error.message);
  }

  const serviceClient = createServiceSupabaseClient();
  if (!serviceClient) {
    throw new DashboardOperationError(
      "Service role key is not configured; cannot sync sign-in metadata for this user.",
      503,
    );
  }

  const { data: authData, error: getAuthError } = await serviceClient.auth.admin.getUserById(id);
  if (getAuthError || !authData?.user) {
    throw new DashboardOperationError(getAuthError?.message ?? "Auth user not found.", 404);
  }

  const authUser = authData.user;
  const user_metadata: Record<string, unknown> = { ...(authUser.user_metadata ?? {}) };
  if (input.role != null) {
    user_metadata.role = input.role;
  }
  if (input.delivery_zone !== undefined) {
    user_metadata.delivery_zone = input.delivery_zone;
  }

  const app_metadata: Record<string, unknown> = { ...(authUser.app_metadata ?? {}) };
  if (input.role != null) {
    app_metadata.role = input.role;
  }

  const { error: authUpdateError } = await serviceClient.auth.admin.updateUserById(id, {
    user_metadata,
    app_metadata,
  });

  if (authUpdateError) {
    throw new DashboardOperationError(authUpdateError.message);
  }

  await auditAdminAction(context.user.id, "user_role_or_zone", "user", id, {
    ...dbPatch,
  });

  revalidatePath("/admin");
  revalidatePath(getDashboardRoute(nextRole));

  return {
    message: "Account role and delivery settings updated. The user should refresh the app or sign in again to see all changes.",
  };
}

function rowRole(value: unknown): UserRole {
  return typeof value === "string" && USER_ROLE_SET.has(value as UserRole)
    ? (value as UserRole)
    : "buyer";
}

export async function updateShopForAdmin(shopId: string, isActive: boolean) {
  const context = await requireSessionUser();
  ensureRole(context.user, ["admin"]);

  const { error } = await context.supabase
    .from("shops")
    .update({ is_active: isActive })
    .eq("id", shopId);

  if (error) {
    throw new DashboardOperationError(error.message);
  }

  await auditAdminAction(context.user.id, "shop_moderation", "shop", shopId, {
    is_active: isActive,
  });

  revalidatePath("/admin");
  revalidatePath("/merchant");
  revalidatePath("/products");
  revalidatePath("/");

  return {
    message: isActive ? "Shop restored to the live marketplace." : "Shop hidden from buyers.",
  };
}

export async function updateOrderForCurrentUser(orderId: string, input: OrderActionInput) {
  const context = await requireSessionUser();
  const order = await getSingleRow(context, "orders", orderId, "Order");

  switch (context.user.role) {
    case "seller":
      return updateOrderForSeller(context, orderId, order, input.action);
    case "runner":
      return updateOrderForRunner(context, orderId, order, input);
    case "admin":
      return updateOrderForAdmin(context, orderId, input);
    default:
      throw new DashboardOperationError("This account cannot change order workflow.", 403);
  }
}

async function updateOrderForSeller(
  context: SupabaseContext,
  orderId: string,
  order: Row,
  action: OrderActionInput["action"],
) {
  await requireSellerOrderAccess(context, order);

  const currentStatus = normalizeStatus(order.status);
  let nextStatus: OrderStatus;

  switch (action) {
    case "seller_dispatch":
      if (!["PAID_ESCROW", "LOCKED"].includes(currentStatus)) {
        throw new DashboardOperationError("Only paid or locked orders can be dispatched.", 400);
      }
      nextStatus = "DISPATCHED";
      break;
    case "seller_lock":
      nextStatus = "LOCKED";
      break;
    case "seller_resume":
      if (!["LOCKED", "FAILED"].includes(currentStatus)) {
        throw new DashboardOperationError("Only blocked orders can be resumed.", 400);
      }
      nextStatus = "PAID_ESCROW";
      break;
    case "seller_fail":
      nextStatus = "FAILED";
      break;
    default:
      throw new DashboardOperationError("This seller action is not supported.", 400);
  }

  const { error } = await context.supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId);

  if (error) {
    throw new DashboardOperationError(error.message);
  }

  revalidateOrderViews(orderId);

  return {
    message:
      nextStatus === "DISPATCHED"
        ? "Order dispatched to the runner queue."
        : nextStatus === "PAID_ESCROW"
          ? "Order returned to the paid fulfillment queue."
          : nextStatus === "LOCKED"
            ? "Order locked for manual review."
            : "Order marked as failed.",
  };
}

async function updateOrderForRunner(
  context: SupabaseContext,
  orderId: string,
  order: Row,
  input: OrderActionInput,
) {
  const currentStatus = normalizeStatus(order.status);
  const currentRunnerId = toNullableString(order.runner_id);
  const currentZone = normalizeDeliveryZone(order.delivery_zone);
  const canClaimZoneOrder =
    currentRunnerId == null &&
    currentStatus === "DISPATCHED" &&
    currentZone != null &&
    currentZone === context.user.delivery_zone;

  if (currentRunnerId && currentRunnerId !== context.user.id) {
    throw new DashboardOperationError("This delivery is assigned to another runner.", 403);
  }

  if (!canClaimZoneOrder && currentRunnerId !== context.user.id) {
    throw new DashboardOperationError("This order is outside your current runner access.", 403);
  }

  switch (input.action) {
    case "runner_claim": {
      if (!canClaimZoneOrder) {
        throw new DashboardOperationError("Only open dispatched orders in your zone can be claimed.", 400);
      }
      const { error } = await context.supabase
        .from("orders")
        .update({ runner_id: context.user.id })
        .eq("id", orderId);
      if (error) throw new DashboardOperationError(error.message);
      revalidateOrderViews(orderId);
      return { message: "Delivery claimed and added to your queue." };
    }
    case "runner_release": {
      if (currentRunnerId !== context.user.id) {
        throw new DashboardOperationError("Only your own delivery can be released.", 400);
      }
      const { error } = await context.supabase
        .from("orders")
        .update({ runner_id: null })
        .eq("id", orderId);
      if (error) throw new DashboardOperationError(error.message);
      revalidateOrderViews(orderId);
      return { message: "Delivery returned to the zone queue." };
    }
    case "runner_pickup": {
      if (currentRunnerId !== context.user.id || currentStatus !== "PAID_ESCROW") {
        throw new DashboardOperationError("Only assigned paid orders can be marked as picked up.", 400);
      }
      const { error } = await context.supabase
        .from("orders")
        .update({ status: "DISPATCHED" })
        .eq("id", orderId);
      if (error) throw new DashboardOperationError(error.message);
      revalidateOrderViews(orderId);
      return { message: "Pickup confirmed. Delivery is now in transit." };
    }
    case "runner_complete": {
      if (currentRunnerId !== context.user.id || currentStatus !== "DISPATCHED") {
        throw new DashboardOperationError(
          "Only assigned in-transit deliveries can be completed by OTP.",
          400,
        );
      }
      const otp = input.otp?.trim() ?? "";
      const expectedOtp = toNullableString(order.delivery_otp);
      if (!otp || otp !== expectedOtp) {
        throw new DashboardOperationError("Enter the correct delivery OTP to complete the drop-off.", 400);
      }
      const { error } = await context.supabase
        .from("orders")
        .update({
          status: "COMPLETED",
          runner_id: currentRunnerId ?? context.user.id,
        })
        .eq("id", orderId);
      if (error) throw new DashboardOperationError(error.message);
      revalidateOrderViews(orderId);
      return { message: "Delivery completed and confirmed by OTP." };
    }
    case "runner_lock": {
      const { error } = await context.supabase
        .from("orders")
        .update({
          status: "LOCKED",
          runner_id: currentRunnerId ?? context.user.id,
        })
        .eq("id", orderId);
      if (error) throw new DashboardOperationError(error.message);
      revalidateOrderViews(orderId);
      return { message: "Delivery locked for admin follow-up." };
    }
    default:
      throw new DashboardOperationError("This runner action is not supported.", 400);
  }
}

async function updateOrderForAdmin(
  context: SupabaseContext,
  orderId: string,
  input: OrderActionInput,
) {
  ensureRole(context.user, ["admin"]);

  const patch: Record<string, unknown> = {};
  if (input.status != null) {
    if (!ORDER_STATUS_SET.has(input.status)) {
      throw new DashboardOperationError("Choose a valid order status.", 400);
    }
    patch.status = input.status;
  }

  if (input.runnerId !== undefined) {
    patch.runner_id = normalizeRunnerId(input.runnerId);
    if (typeof patch.runner_id === "string") {
      await requireRunnerUser(context, patch.runner_id);
    }
  }

  if (input.adminNote !== undefined) {
    patch.admin_note = input.adminNote?.trim() ? input.adminNote.trim() : null;
  }

  if (!Object.keys(patch).length) {
    throw new DashboardOperationError("Provide at least one admin change for this order.", 400);
  }

  const { error } = await context.supabase
    .from("orders")
    .update(patch)
    .eq("id", orderId);

  if (error) {
    throw new DashboardOperationError(error.message);
  }

  await auditAdminAction(context.user.id, "order_intervention", "order", orderId, patch);
  revalidateOrderViews(orderId);

  return { message: "Admin order controls saved." };
}

async function requireSessionUser(): Promise<SupabaseContext> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new DashboardOperationError("Supabase is not configured.", 503);
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new DashboardOperationError("Sign in to continue.", 401);
  }

  return {
    supabase,
    user: mapSupabaseUser(user),
  };
}

function ensureRole(user: User, roles: User["role"][]) {
  if (!roles.includes(user.role)) {
    throw new DashboardOperationError("You do not have permission to do that.", 403);
  }
}

async function requireOwnedShop(context: SupabaseContext, shopId: string) {
  const { data, error } = await context.supabase
    .from("shops")
    .select("id, owner_id")
    .eq("id", shopId)
    .single();

  if (error || !data) {
    throw new DashboardOperationError("Select a valid seller shop before saving.", 400);
  }

  if (toString(data.owner_id) !== context.user.id) {
    throw new DashboardOperationError("This shop is not owned by the current seller.", 403);
  }
}

async function requireSellerOrderAccess(context: SupabaseContext, order: Row) {
  const sellerId = toNullableString(order.seller_id);
  const shopId = toNullableString(order.shop_id);

  if (sellerId === context.user.id) {
    return;
  }

  if (!shopId) {
    throw new DashboardOperationError("This order is not linked to a seller shop.", 400);
  }

  await requireOwnedShop(context, shopId);
}

async function requireRunnerUser(context: SupabaseContext, runnerId: string) {
  const { data, error } = await context.supabase
    .from("users")
    .select("id, role")
    .eq("id", runnerId)
    .single();

  if (error || !data || toString(data.role) !== "runner") {
    throw new DashboardOperationError("Select a valid runner account.", 400);
  }
}

async function getSingleRow(
  context: SupabaseContext,
  table: string,
  id: string,
  label: string,
) {
  const { data, error } = await context.supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new DashboardOperationError(`${label} not found.`, 404);
  }

  return data as Row;
}

async function auditAdminAction(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  meta: Record<string, unknown>,
) {
  const serviceClient = createServiceSupabaseClient();
  if (!serviceClient) {
    return;
  }

  await serviceClient.from("admin_audit_logs").insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    meta,
  });
}

function validateProductInput(input: ProductInput) {
  if (!input.shopId.trim()) {
    throw new DashboardOperationError("Choose the shop that owns this product.", 400);
  }

  if (!input.name.trim()) {
    throw new DashboardOperationError("Product name is required.", 400);
  }

  if (!input.description.trim()) {
    throw new DashboardOperationError("Product description is required.", 400);
  }

  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new DashboardOperationError("Enter a price greater than zero.", 400);
  }

  if (!Number.isInteger(input.stock) || input.stock < 0) {
    throw new DashboardOperationError("Stock must be zero or more.", 400);
  }

  if (!PRODUCT_CATEGORY_SET.has(input.category)) {
    throw new DashboardOperationError("Choose a valid product category.", 400);
  }

  return {
    shop_id: input.shopId.trim(),
    name: input.name.trim(),
    description: input.description.trim(),
    price: input.price,
    stock: input.stock,
    category: input.category,
    images: sanitizeImageUrls(input.imageUrls),
    is_active: input.isActive,
  };
}

function buildProductPatch(input: Partial<ProductInput>): ProductPatch {
  const patch: ProductPatch = {};

  if (input.shopId !== undefined) {
    if (!input.shopId.trim()) {
      throw new DashboardOperationError("Choose the shop that owns this product.", 400);
    }
    patch.shop_id = input.shopId.trim();
  }

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      throw new DashboardOperationError("Product name is required.", 400);
    }
    patch.name = input.name.trim();
  }

  if (input.description !== undefined) {
    if (!input.description.trim()) {
      throw new DashboardOperationError("Product description is required.", 400);
    }
    patch.description = input.description.trim();
  }

  if (input.price !== undefined) {
    if (!Number.isFinite(input.price) || input.price <= 0) {
      throw new DashboardOperationError("Enter a price greater than zero.", 400);
    }
    patch.price = input.price;
  }

  if (input.stock !== undefined) {
    if (!Number.isInteger(input.stock) || input.stock < 0) {
      throw new DashboardOperationError("Stock must be zero or more.", 400);
    }
    patch.stock = input.stock;
  }

  if (input.category !== undefined) {
    if (!PRODUCT_CATEGORY_SET.has(input.category)) {
      throw new DashboardOperationError("Choose a valid product category.", 400);
    }
    patch.category = input.category;
  }

  if (input.imageUrls !== undefined) {
    patch.images = sanitizeImageUrls(input.imageUrls);
  }

  if (input.isActive !== undefined) {
    patch.is_active = input.isActive;
  }

  return patch;
}

function sanitizeImageUrls(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeRunnerId(value: string | null | undefined) {
  const nextValue = value?.trim();
  if (!nextValue || nextValue === "__unassigned__") {
    return null;
  }
  return nextValue;
}

function revalidateProductViews(productId: string) {
  revalidatePath("/merchant");
  revalidatePath("/merchant/products");
  revalidatePath("/merchant/products/new");
  revalidatePath(`/merchant/products/${productId}`);
  revalidatePath("/admin");
  revalidatePath("/products");
  revalidatePath("/");
}

function revalidateOrderViews(orderId: string) {
  revalidatePath("/merchant");
  revalidatePath("/merchant/orders");
  revalidatePath("/runner");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}

function toString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeStatus(value: unknown): OrderStatus {
  return typeof value === "string" && ORDER_STATUS_SET.has(value as OrderStatus)
    ? (value as OrderStatus)
    : "PENDING";
}

function normalizeDeliveryZone(value: unknown): DeliveryZone | null {
  return typeof value === "string" && DELIVERY_ZONE_SET.has(value as DeliveryZone)
    ? (value as DeliveryZone)
    : null;
}
