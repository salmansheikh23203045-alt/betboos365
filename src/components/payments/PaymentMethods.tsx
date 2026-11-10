import Image from "next/image";
import type { PaymentMethod } from "@/types";

export interface PaymentMethodsProps {
  methods: PaymentMethod[];
  title?: string;
}

/**
 * PaymentMethods — "Accepted Payment Method" strip.
 * Reference: full-width dark pill with red border, logos in a single row.
 * Until official logos are supplied, each method is a text chip (not a fake logo).
 * Logos are third-party trademarks and need licensed files.
 */
export function PaymentMethods({ methods, title = "Accepted Payment Method" }: PaymentMethodsProps) {
  return (
    <section
      aria-label={title}
      className="mx-auto flex max-w-[1280px] flex-col items-center gap-3 px-4 py-3 lg:flex-row lg:gap-6 lg:px-6"
    >
      <p className="shrink-0 text-caption font-bold uppercase tracking-wide text-tcl-white">{title}</p>
      <ul className="flex w-full flex-wrap items-center justify-center gap-2 rounded-pill border border-tcl-red bg-tcl-black px-4 py-2 glow-red-soft max-lg:rounded-card max-lg:px-3 max-lg:py-3 lg:flex-nowrap lg:gap-4">
        {methods.map((method) => (
          <li key={method.id} className="flex items-center justify-center">
            {method.logoSrc ? (
              <Image src={method.logoSrc} alt={method.name} width={72} height={24} className="h-5 w-auto" />
            ) : (
              <span className="rounded-md border border-tcl-white/15 px-2 py-0.5 text-label font-bold uppercase tracking-wide text-tcl-white">
                {method.name}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
