"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";

interface PromotionInput {
  id?: string;
  title: string;
  description: string;
  badge: string;
  ctaLabel: string;
  ctaHref: string;
  isActive: boolean;
  startDate: string; // yyyy-mm-dd (converted to ISO before POST)
  endDate: string;
  minVipLevel: number;
}

function toDateInput(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function PromotionForm({
  mode,
  promotion,
}: {
  mode: "create" | "edit";
  promotion?: PromotionInput;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [form, setForm] = useState<PromotionInput>({
    title: promotion?.title ?? "",
    description: promotion?.description ?? "",
    badge: promotion?.badge ?? "NEW",
    ctaLabel: promotion?.ctaLabel ?? "Claim Now",
    ctaHref: promotion?.ctaHref ?? "/promotion",
    isActive: promotion?.isActive ?? true,
    startDate: toDateInput(promotion?.startDate) || new Date().toISOString().slice(0, 10),
    endDate: toDateInput(promotion?.endDate) || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    minVipLevel: promotion?.minVipLevel ?? 0,
  });
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "err"; msg?: string }>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof PromotionInput>(k: K, v: PromotionInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "idle" });
    if (!form.title || !form.description || !form.badge || !form.ctaLabel || !form.ctaHref) {
      setStatus({ kind: "err", msg: "Please fill in all fields." });
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setStatus({ kind: "err", msg: "End date must be after start date." });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        badge: form.badge,
        ctaLabel: form.ctaLabel,
        ctaHref: form.ctaHref,
        isActive: form.isActive,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        minVipLevel: form.minVipLevel,
      };
      const url = mode === "create" ? "/api/admin/promotions" : `/api/admin/promotions/${promotion!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ message: "Save failed" }))) as { message?: string };
        setStatus({ kind: "err", msg: body.message ?? `Save failed (${res.status})` });
        setSubmitting(false);
        return;
      }
      startTransition(() => {
        router.replace("/admin/promotions");
        router.refresh();
      });
    } catch {
      setStatus({ kind: "err", msg: "Network error. Please try again." });
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!promotion?.id) return;
    if (!confirm(`Delete promotion "${promotion.title}"? This cannot be undone.`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/promotions/${promotion.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ message: "Delete failed" }))) as { message?: string };
        setStatus({ kind: "err", msg: body.message ?? `Delete failed (${res.status})` });
        setSubmitting(false);
        return;
      }
      startTransition(() => {
        router.replace("/admin/promotions");
        router.refresh();
      });
    } catch {
      setStatus({ kind: "err", msg: "Network error." });
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-heading-lg uppercase text-tcl-white">
          {mode === "create" ? "New Promotion" : "Edit Promotion"}
        </h2>
        <Link
          href="/admin/promotions"
          className="text-[12px] text-tcl-muted underline hover:text-tcl-white"
        >
          ← Back to list
        </Link>
      </div>

      {status.kind !== "idle" ? (
        <div
          role={status.kind === "err" ? "alert" : "status"}
          className={cn(
            "rounded-md border px-3 py-2 text-caption",
            status.kind === "ok"
              ? "border-tcl-success/40 bg-tcl-success/10 text-tcl-success"
              : "border-tcl-red/40 bg-tcl-red/10 text-tcl-red-bright",
          )}
        >
          {status.msg}
        </div>
      ) : null}

      <NeonCard className="space-y-4 p-5">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label="Title">
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} placeholder="100% WELCOME BONUS" required disabled={submitting} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={`${inputCls} py-2`} placeholder="Short marketing copy…" required disabled={submitting} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Badge">
              <input value={form.badge} onChange={(e) => set("badge", e.target.value)} className={inputCls} placeholder="NEW / HOT / VIP" required disabled={submitting} />
            </Field>
            <Field label="Min VIP level">
              <input
                type="number"
                value={form.minVipLevel}
                onChange={(e) => set("minVipLevel", Math.max(0, parseInt(e.target.value) || 0))}
                className={inputCls}
                min={0}
                disabled={submitting}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CTA label">
              <input value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} className={inputCls} placeholder="Claim Now" required disabled={submitting} />
            </Field>
            <Field label="CTA target URL">
              <input value={form.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} className={inputCls} placeholder="/promotion" required disabled={submitting} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date">
              <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputCls} required disabled={submitting} />
            </Field>
            <Field label="End date">
              <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={inputCls} required disabled={submitting} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-tcl-white">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="accent-tcl-gold" disabled={submitting} />
            Active (drafts are hidden from the public promotions page)
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <PrimaryButton type="submit" size="md" disabled={submitting}>
              {submitting ? "Saving…" : mode === "create" ? "Create promotion" : "Save changes"}
            </PrimaryButton>
            {mode === "edit" ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="rounded-md border border-tcl-red/40 bg-tcl-red/10 px-4 py-2 text-sm font-semibold text-tcl-red-bright hover:border-tcl-red/70 disabled:opacity-50 cursor-pointer"
              >
                <ICONS.X aria-hidden="true" className="mr-1 inline-block size-3.5" />
                Delete
              </button>
            ) : null}
            <SecondaryButton size="md" variant="outline" href="/admin/promotions" disabled={submitting}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </NeonCard>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none disabled:opacity-60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-caption font-semibold text-tcl-white">{label}</span>
      {children}
    </label>
  );
}
