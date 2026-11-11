import { cn } from "@/lib/cn";
import type { PaymentProvider } from "@/types/wallet";

/**
 * Brand mark for Bangladeshi mobile financial services. No vendor logos
 * are shipped — the mark is the provider's brand-color stylised initial with
 * the brand color applied as a glowing background, so the identity is clear
 * at a glance without infringing a logo. Replace with vendor-supplied PNG/SVG
 * once licensing is confirmed.
 */
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
      ? "size-9 text-[12px]"
      : size === "lg"
        ? "size-14 text-[18px]"
        : "size-11 text-[14px]";
  const initial = provider.name.charAt(0).toUpperCase();
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full font-bold uppercase text-white",
        "border border-white/10",
        sizeClass,
        className,
      )}
      style={{
        backgroundColor: provider.brandColor,
        boxShadow: `0 0 18px ${provider.brandColor}66, inset 0 0 12px rgba(0,0,0,0.3)`,
      }}
      aria-label={provider.name}
    >
      <span>{initial}</span>
    </div>
  );
}
