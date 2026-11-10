import Link from "next/link";
import { ICONS, type IconName } from "@/lib/icons";
import { Logo } from "@/components/ui/Logo";
import { FOOTER_COLUMNS, SOCIAL_LINKS } from "@/data/mock";

/**
 * Social glyphs. Lucide has no brand icons, so generic glyphs stand in
 * until official brand SVGs are supplied (see docs/UI_REFERENCE_ANALYSIS.md §5).
 */
const SOCIAL_ICON: Record<string, IconName> = {
  youtube: "Play",
  facebook: "Share2",
  telegram: "Send",
  instagram: "Camera",
  tiktok: "Music2",
};

function SocialButton({ id, label, href }: { id: string; label: string; href: string }) {
  const Icon = ICONS[SOCIAL_ICON[id] ?? "Globe"];
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-pill bg-red-gradient text-tcl-white neon-border-red hover:brightness-110 transition"
    >
      <Icon aria-hidden="true" className="size-4" />
    </a>
  );
}

function FooterHeading({ children }: { children: string }) {
  return (
    <h3 className="mb-3 text-heading-sm font-bold uppercase tracking-wide text-tcl-gold">{children}</h3>
  );
}

function StoreBadge({ icon, label, href, className }: { icon: IconName; label: string; href: string; className?: string }) {
  const Icon = ICONS[icon];
  return (
    <a
      href={href}
      className={`inline-flex h-10 items-center gap-2 rounded-md border border-tcl-white/20 bg-tcl-black px-3 text-caption font-semibold text-tcl-white hover:border-tcl-gold transition-colors ${className ?? ""}`}
    >
      <Icon aria-hidden="true" className="size-4 text-tcl-gold" />
      {label}
    </a>
  );
}

/** Outlined gold pill used for responsible-gambling badges. */
function LegalBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-pill border border-tcl-gold/60 px-2.5 py-1 text-label font-bold uppercase tracking-wide text-tcl-gold">
      {children}
    </span>
  );
}

/**
 * Footer — brand blurb, link columns, app download, social, and legal bar.
 * Reference is the desktop footer only. The mobile arrangement is inferred
 * (single column stack) and is listed as an open question in CLAUDE_PROJECT_STATE.md.
 */
export function Footer() {
  return (
    <footer className="mt-10 border-t border-tcl-red/50 bg-gradient-to-b from-tcl-black to-tcl-surface">
      <div className="px-4 pt-6 pb-5 text-center sm:hidden">
        <div className="flex justify-center">
          <Logo size="sm" />
        </div>
        <p className="mx-auto mt-3 max-w-[300px] text-[12px] leading-relaxed text-tcl-muted">
          TCL11 is a trusted online entertainment platform with a wide range of casino, slots, live casino,
          sports and more. Play safely and enjoy exciting rewards.
        </p>
        <div className="mt-4 flex justify-center gap-2.5">
          {SOCIAL_LINKS.map((link) => (
            <SocialButton key={link.id} id={link.id} label={link.label} href={link.href} />
          ))}
        </div>

        <div className="footer-glow-divider my-5" />

        <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-tcl-gold">Get The App</h3>
        <div className="flex flex-col gap-2">
          <StoreBadge icon="Smartphone" label="Download for Android" href="#" className="w-full justify-center" />
          <StoreBadge icon="Smartphone" label="Download for iOS" href="#" className="w-full justify-center" />
        </div>
      </div>

      <div className="mx-auto hidden max-w-[1280px] gap-8 px-4 py-10 sm:grid sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr_1fr] lg:px-6">
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <Logo size="md" />
          <p className="max-w-xs text-caption text-tcl-muted">
            TCL11 is a trusted online entertainment platform with a wide range of casino, slots, live casino,
            sports and more. Play safely and enjoy exciting rewards.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <FooterHeading>{column.title}</FooterHeading>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1.5 text-caption text-tcl-white hover:text-tcl-gold transition-colors"
                  >
                    <ICONS.ChevronRight aria-hidden="true" className="size-3 text-tcl-gold" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <FooterHeading>Get The App</FooterHeading>
          <p className="mb-3 text-caption text-tcl-muted">Download our mobile app for a better experience.</p>
          {/* Store badges: replace with official badge files when supplied. */}
          <div className="flex flex-col gap-2">
            <StoreBadge icon="Smartphone" label="Download for Android" href="#" />
            <StoreBadge icon="Smartphone" label="Download for iOS" href="#" />
          </div>
        </div>

        <div>
          <FooterHeading>Follow Us</FooterHeading>
          <div className="flex flex-wrap gap-2">
            {SOCIAL_LINKS.map((link) => (
              <SocialButton key={link.id} id={link.id} label={link.label} href={link.href} />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-tcl-red/30">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-4 py-4 text-caption text-tcl-muted sm:flex-row lg:px-6 max-sm:gap-2 max-sm:py-3 max-sm:text-[11px]">
          <p>© 2026 TCL11. All Rights Reserved.</p>
          <div className="flex items-center gap-3">
            <LegalBadge>18+ Play Responsibly</LegalBadge>
            <LegalBadge>Gambling Aware</LegalBadge>
          </div>
        </div>
      </div>
    </footer>
  );
}
