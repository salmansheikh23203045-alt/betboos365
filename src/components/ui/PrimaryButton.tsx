import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ICONS, type IconName } from "@/lib/icons";
import { buttonClasses, type ButtonShape, type ButtonSize } from "./button-styles";

/**
 * PrimaryButton — red gradient with glow.
 * Reference use: "Sign Up" (desktop header, mobile auth row).
 */
export interface PrimaryButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  href?: string;
  size?: ButtonSize;
  shape?: ButtonShape;
  fullWidth?: boolean;
  icon?: IconName;
}

export function PrimaryButton({
  children,
  href,
  size = "md",
  shape = "rect",
  fullWidth,
  icon,
  className,
  type = "button",
  ...rest
}: PrimaryButtonProps) {
  const Icon = icon ? ICONS[icon] : null;
  const classes = buttonClasses({
    size,
    shape,
    fullWidth,
    className: `btn-red text-tcl-white ${className ?? ""}`,
  });
  const content = (
    <>
      {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
      {children}
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
