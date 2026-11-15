import { cn } from "@/lib/cn";
import type { PaymentProvider } from "@/types/wallet";

export function ProviderLogo({
  provider,
  size = "md",
  className,
}: {
  provider: Pick<PaymentProvider, "name" | "brandColor" | "code" | "logoUrl">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "sm"
      ? "size-9"
      : size === "lg"
        ? "size-14"
        : "size-11";

  const code = (provider.code || "").toUpperCase();

  const logoMap: Record<string, string> = {
    BKASH: "/images/payments/bkash.png",
    NAGAD: "/images/payments/nagad.png",
    ROCKET: "/images/payments/rocket.png",
    UPAY: "/images/payments/upay.png",
  };

  const imgSrc = logoMap[code] ?? provider.logoUrl;

  if (imgSrc) {
    return (
      <div
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-white/5 border border-white/10 shrink-0",
          sizeClass,
          className,
        )}
        aria-label={provider.name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={provider.name}
          className="size-full object-contain p-1"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg font-bold uppercase text-white shrink-0",
        "border border-white/10",
        sizeClass,
        className,
      )}
      style={{
        backgroundColor: provider.brandColor || "#e2136c",
      }}
      aria-label={provider.name}
    >
      <span className="text-xs">{provider.name.charAt(0)}</span>
    </div>
  );
}
