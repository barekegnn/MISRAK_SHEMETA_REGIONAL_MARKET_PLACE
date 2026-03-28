import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-500/15 text-brand-800 dark:bg-brand-500/20",
        secondary: "border-brand-200 bg-brand-50 text-brand-800",
        accent:
          "border-accent-500/40 bg-accent-500/15 text-amber-900",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800",
        destructive: "border-red-200 bg-red-50 text-red-800",
        outline: "text-brand-800 border-brand-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
