import { notFound } from "next/navigation";
import { getOrder } from "@/app/actions/orders";
import { OrderDetail } from "./order-detail";
import type { OrderItemRow, OrderStatus } from "@/types";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, error } = await getOrder(id);
  if (error || !data) notFound();

  const row = data as {
    id: string;
    status: OrderStatus;
    total: number | string;
    subtotal: number | string;
    delivery_fee: number | string;
    otp: string;
    items: OrderItemRow[];
    shops: { name: string; phone: string; city: string } | null;
  };

  return <OrderDetail order={row} />;
}
