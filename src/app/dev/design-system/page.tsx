import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignSystemShowcase } from "@/components/dev/DesignSystemShowcase";

/* Internal visual-testing route. Not linked from any public navigation.
 * Disabled in production: every production request returns 404. */
export const metadata: Metadata = {
  title: "Design system (dev only)",
  robots: { index: false, follow: false },
};

export default function DevDesignSystemPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <DesignSystemShowcase />;
}
