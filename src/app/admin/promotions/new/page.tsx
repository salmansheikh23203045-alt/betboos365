import type { Metadata } from "next";
import { PromotionForm } from "../PromotionForm";

export const metadata: Metadata = { title: "New Promotion | TCL11 Admin" };
export const dynamic = "force-dynamic";

export default function NewPromotionPage() {
  return <PromotionForm mode="create" />;
}
