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
import { OnboardingOrchestrator } from "@/components/onboarding/OnboardingOrchestrator";
import { WalletBalanceProvider } from "@/components/wallet/WalletBalanceProvider";
import { TelegramBonusPopup } from "@/components/promo/TelegramBonusPopup";
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
  title: "BetBoos365",
  description: "BetBoos365 — online casino, slots, live casino, sports and promotions.",
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
      {/* Public chrome (DesktopHeader, PromoMarquee, MobileHeader, Footer,
          MobileBottomNavigation) is tagged `data-chrome="public"`; the
          admin shell sets `data-admin-shell`, and a global CSS rule in
          globals.css hides public chrome when an admin shell is present
          anywhere in the body. Keeps the public layout untouched when
          nothing admin is mounted. */}
      <body className="flex min-h-dvh flex-col max-lg:pb-16">
        <AuthProvider initialUser={user}>
          <WalletBalanceProvider>
          <div data-chrome="public" className="contents">
            <DesktopHeader navItems={NAV_ITEMS} />
            <PromoMarquee />
            <MobileHeader />
          </div>
          <main className="flex-1">{children}</main>
          <div data-chrome="public" className="contents">
            <Footer />
            <MobileBottomNavigation items={MOBILE_TABS} />
          </div>
          <OnboardingOrchestrator />
          <TelegramBonusPopup />
          </WalletBalanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
