import { AlertTriangle, CheckCircle2, Circle, CircleDot } from "lucide-react";
import type { BuyerTrackingOrder, OrderStatus, TrackingStep } from "@/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_ALERTS: Partial<Record<OrderStatus, { title: string; description: string }>> = {
  FAILED: {
    title: "Shipment issue reported",
    description:
      "This order needs attention before delivery can continue. Please contact support if you do not hear from the shop.",
  },
  LOCKED: {
    title: "Delivery review in progress",
    description:
      "OTP confirmation was locked for review. The order team may contact you before the delivery is closed out.",
  },
};

export function TrackingTimeline({ tracking }: { tracking: BuyerTrackingOrder }) {
  const statusAlert = STATUS_ALERTS[tracking.order.status];

  return (
    <Card className="border-neutral-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-[#1E1B4B]">Tracking timeline</CardTitle>
        <CardDescription>
          Follow each stage from order approval to final delivery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1">
          {tracking.steps.map((step, index) => (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <StepIcon step={step} />
                {index < tracking.steps.length - 1 ? (
                  <span
                    className={cn(
                      "mt-2 h-10 w-px",
                      step.completed || step.current ? "bg-indigo-200" : "bg-neutral-200",
                    )}
                  />
                ) : null}
              </div>
              <div className="pb-5">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    step.current || step.completed ? "text-[#1E1B4B]" : "text-neutral-500",
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-1 max-w-md text-sm text-neutral-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {statusAlert ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="size-4" />
              <p className="text-sm font-semibold">{statusAlert.title}</p>
            </div>
            <p className="mt-2 text-sm text-amber-800">{statusAlert.description}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StepIcon({ step }: { step: TrackingStep }) {
  if (step.completed) {
    return <CheckCircle2 className="size-5 text-emerald-600" />;
  }

  if (step.current) {
    return <CircleDot className="size-5 text-[#4F46E5]" />;
  }

  return <Circle className="size-5 text-neutral-300" />;
}
