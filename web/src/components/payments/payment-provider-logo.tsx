import Image from "next/image";
import type { PaymentProvider } from "@/types";
import { cn } from "@/lib/utils";

const SRC: Record<PaymentProvider, string> = {
  chapa: "/payments/chapa.svg",
  mpesa: "/payments/mpesa.svg",
};

const LABEL: Record<PaymentProvider, string> = {
  chapa: "Chapa",
  mpesa: "M-Pesa",
};

type Props = {
  provider: PaymentProvider;
  className?: string;
  height?: number;
  priority?: boolean;
};

export function PaymentProviderLogo({
  provider,
  className,
  height = 32,
  priority,
}: Props) {
  const width = Math.round(height * (120 / 36));

  return (
    <Image
      src={SRC[provider]}
      alt={LABEL[provider]}
      width={width}
      height={height}
      className={cn("w-auto object-contain object-left", className)}
      priority={priority}
      unoptimized
    />
  );
}
