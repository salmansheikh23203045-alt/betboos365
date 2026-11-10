import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ICONS, type IconName } from "@/lib/icons";
import { buttonClasses, type ButtonShape, type ButtonSize } from "./button-styles";

/**
 * SecondaryButton — the gold CTA family.
 * variant "gold":    gold gradient, black text. Reference: "Claim Now", "Bet Now", "Login To View VIP Status".
 * variant "outline": 1px gold border, gold text. Reference: "Log In".
 */
export type SecondaryButtonVariant = "gold" | "outline";

export interface SecondaryButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  variant?: SecondaryButtonVariant;
  href?: string;
  size?: ButtonSize;
  shape?: ButtonShape;
  fullWidth?: boolean;
  icon?: IconName;
  /** Show a trailing arrow (reference: "Claim Now →"). */
  arrow?: boolean;
}

const VARIANT_CLASS: Record<SecondaryButtonVariant, string> = {
  gold: "btn-gold",
  outline: "bg-transparent text-tcl-gold border border-tcl-gold hover:bg-tcl-gold/10",
};

export function SecondaryButton({
  children,
  variant = "gold",
  href,
  size = "md",
  shape = "pill",
  fullWidth,
  icon,
  arrow = false,
  className,
  type = "button",
  ...rest
}: SecondaryButtonProps) {
  const Icon = icon ? ICONS[icon] : null;
  const classes = buttonClasses({
    size,
    shape,
    fullWidth,
    className: `${VARIANT_CLASS[variant]} ${className ?? ""}`,
  });
  const content = (
    <>
      {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
      {children}
      {arrow ? <ICONS.ArrowRight aria-hidden="true" className="size-4 shrink-0" /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  );
}
