import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { backendFetch } from "@/lib/api";
import { PromotionForm } from "../../PromotionForm";

export const metadata: Metadata = { title: "Edit Promotion | TCL11 Admin" };
export const dynamic = "force-dynamic";

interface Promo {
  id: string;
  title: string;
  description: string;
  badge: string;
  ctaLabel: string;
  ctaHref: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  minVipLevel: number;
}

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await backendFetch(`/promotions/${encodeURIComponent(id)}`);
  if (!res.ok) notFound();
  const body = (await res.json()) as { data?: Promo };
  if (!body.data) notFound();

  return <PromotionForm mode="edit" promotion={body.data} />;
}
