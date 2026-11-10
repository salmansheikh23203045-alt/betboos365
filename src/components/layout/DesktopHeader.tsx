import { ICONS } from "@/lib/icons";
import { Logo } from "@/components/ui/Logo";
import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { DesktopNavigation } from "./DesktopNavigation";
import { LanguageSelect } from "./LanguageSelect";
import type { NavItem } from "@/types";

export interface DesktopHeaderProps {
  navItems: NavItem[];
}

/**
 * DesktopHeader — black top bar: logo · icon nav · search · (auth area) · language.
 * The auth area shows Log In/Sign Up when logged out, or the user chip + logout
 * menu when logged in. Visible at lg and up.
 */
export function DesktopHeader({ navItems }: DesktopHeaderProps) {
  return (
    <header className="sticky top-0 z-40 hidden h-16 w-full border-b border-tcl-red/40 bg-tcl-black lg:block">
      <div className="mx-auto flex h-full max-w-[1280px] items-center gap-6 px-6">
        <Logo size="md" />
        <DesktopNavigation items={navItems} />
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            aria-label="Search"
            className="inline-flex size-9 items-center justify-center rounded-pill text-tcl-white hover:text-tcl-gold transition-colors cursor-pointer"
          >
            <ICONS.Search aria-hidden="true" className="size-5" />
          </button>
          <HeaderAuth variant="desktop" />
          <LanguageSelect />
        </div>
      </div>
    </header>
  );
}
