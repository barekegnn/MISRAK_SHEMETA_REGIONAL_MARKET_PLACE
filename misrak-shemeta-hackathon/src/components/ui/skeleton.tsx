import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-brand-100 via-brand-50 to-brand-100 bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
