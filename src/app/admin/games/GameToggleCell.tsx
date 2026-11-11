"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

export function GameToggleCell({
  id,
  initialActive,
  title,
}: {
  id: string;
  initialActive: boolean;
  title: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleToggle() {
    setErr(null);
    setPending(true);
    const next = !active;
    try {
      const res = await fetch(`/api/admin/games/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ message: "Failed" }))) as { message?: string };
        setErr(body.message ?? `Failed (${res.status})`);
        setPending(false);
        return;
      }
      setActive(next);
      startTransition(() => router.refresh());
    } catch {
      setErr("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        aria-pressed={active}
        aria-label={`Toggle active state for ${title}`}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors disabled:opacity-50",
          active ? "border-tcl-success/60 bg-tcl-success/20" : "border-tcl-border-muted bg-tcl-surface-2",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full transition-transform",
            active ? "translate-x-6 bg-tcl-success" : "translate-x-1 bg-tcl-muted",
          )}
        />
      </button>
      {err ? <span className="text-[10px] text-tcl-red-bright">{err}</span> : null}
    </div>
  );
}
