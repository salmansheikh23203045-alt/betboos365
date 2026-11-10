import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNavigation } from "@/components/layout/MobileBottomNavigation";
import { Footer } from "@/components/layout/Footer";
import { MOBILE_TABS, NAV_ITEMS } from "@/data/mock";
import { PromoMarquee } from "@/components/layout/PromoMarquee";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { getSession } from "@/lib/session";

/* Display face: heavy condensed sans. Closest free match to the reference hero/section titles.
 * Final choice is confirmed by side-by-side review (roadmap Step 03 / CLAUDE_PROJECT_STATE.md). */
const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

/* UI and body face. */
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TCL11",
  description: "TCL11 — online casino, slots, live casino, sports and promotions.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Server-side session resolution means the first paint already has the
  // right header auth state — no client-side flicker from "Log In" to a
  // logged-in chip after hydration.
  const user = await getSession();

  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      {/* Mobile: clearance for the fixed 64px bottom nav sits after the footer, so the nav never covers the legal bar. */}
      <body className="flex min-h-dvh flex-col max-lg:pb-16">
        <AuthProvider initialUser={user}>
          <DesktopHeader navItems={NAV_ITEMS} />
          <PromoMarquee />
          <MobileHeader />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileBottomNavigation items={MOBILE_TABS} />
        </AuthProvider>
      </body>
    </html>
  );
}
