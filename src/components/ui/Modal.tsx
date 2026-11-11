"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  closeOnBackdrop?: boolean;
}

const SIZE_CLASS: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in-up"
        style={{ animationDuration: "180ms" }}
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full outline-none",
          "sm:w-auto",
          SIZE_CLASS[size],
        )}
      >
        <div
          className={cn(
            "neon-border-red glow-red-soft bg-gradient-to-b from-tcl-surface-1 to-tcl-black",
            "rounded-t-2xl sm:rounded-card",
            "overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.25)]",
            "animate-fade-in-up",
          )}
        >
          <header className="flex items-start gap-3 border-b border-tcl-red/30 bg-tcl-black/60 px-5 py-4">
            <div className="flex-1 min-w-0">
              <h2
                id="modal-title"
                className="font-display text-heading-md uppercase text-tcl-white tracking-wide"
              >
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-0.5 text-caption text-tcl-muted">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-tcl-muted transition-colors hover:bg-tcl-surface-2 hover:text-tcl-white cursor-pointer tap-feedback"
            >
              <ICONS.X aria-hidden="true" className="size-5" />
            </button>
          </header>
          <div className="px-5 py-5">{children}</div>
          {footer ? (
            <footer className="border-t border-tcl-border-muted bg-tcl-black/40 px-5 py-4">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
