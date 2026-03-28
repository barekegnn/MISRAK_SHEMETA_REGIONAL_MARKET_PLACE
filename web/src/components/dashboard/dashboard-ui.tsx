import type { OrderStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";

export function DashboardShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4F46E5]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1E1B4B]">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      <div className="mt-8 space-y-8">{children}</div>
    </main>
  );
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-neutral-200 bg-white">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-bold text-[#1E1B4B]">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-neutral-600">{hint}</CardContent>
    </Card>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-neutral-200 bg-white">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg text-[#1E1B4B]">{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function EmptyStateCard({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Card className="border-dashed border-neutral-300 bg-neutral-50/70">
      <CardContent className="flex flex-col items-start gap-4 py-8">
        <div>
          <p className="font-semibold text-[#1E1B4B]">{title}</p>
          <p className="mt-1 max-w-xl text-sm text-neutral-600">{description}</p>
        </div>
        {actionHref && actionLabel ? (
          <LinkButton href={actionHref} className="bg-[#4F46E5] hover:bg-[#4338CA]">
            {actionLabel}
          </LinkButton>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={cn("border-transparent", STATUS_STYLES[status])} variant="outline">
      {formatStatus(status)}
    </Badge>
  );
}

export function formatLabel(value: string | null | undefined, fallback = "Not available") {
  if (!value) return fallback;
  return value.replace(/_/g, " ");
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  PAID_ESCROW: "bg-indigo-100 text-indigo-800",
  DISPATCHED: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-800",
  LOCKED: "bg-neutral-200 text-neutral-700",
};

function formatStatus(status: OrderStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
