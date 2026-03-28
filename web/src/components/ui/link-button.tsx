"use client";

import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
} & VariantProps<typeof buttonVariants>;

export function LinkButton({
  href,
  className,
  variant,
  size,
  children,
  target,
  rel,
}: Props) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className={cn(buttonVariants({ variant, size, className }))}
    >
      {children}
    </Link>
  );
}
