/* Shared TypeScript interfaces for the BetBoos365 UI.
 * Mock-data shapes only. No backend contract is implied until Step 06. */

import type { IconName } from "@/lib/icons";

export type GameCategory = "slots" | "table" | "live-casino" | "fishing" | "arcade";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  /** Icon key from the registry in lib/icons.ts. */
  icon: IconName;
}

export interface Game {
  id: string;
  title: string;
  provider: string;
  category: GameCategory;
  isFree: boolean;
  /** Local artwork path (e.g. /games/featured/megah5.webp). Optional until assets arrive. */
  artSrc?: string;
  /** Provider logo path. Optional until licensed logos arrive. */
  logoSrc?: string;
}

export type TransactionType = "ADD" | "WITHDRAW";
export type TransactionStatus = "SUCCESS" | "WIN" | "PENDING" | "FAILED";

export interface Transaction {
  id: string;
  /** Already masked for display, e.g. "G*****518". */
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
}

export interface VipStatus {
  level: number;
  nextLevel: number;
  /** 0..1 */
  progress: number;
  remainingToUpgrade: number;
  /** When true, the card shows the login CTA instead of progress detail. */
  locked: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  /** Optional logo path. Text fallback is used until logos are supplied. */
  logoSrc?: string;
}

export interface PromotionContent {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface HeroSlide {
  id: string;
  /** Local image under /public (full-bleed artwork with empty space on the left for the text overlay). */
  src: string;
  /** Descriptive alt text for the artwork. */
  alt: string;
  /** CSS object-position per layout, tuned so the subject stays visible when the image is cropped. */
  objectPosition: { desktop: string; mobile: string };
  /** When true, suppresses the global welcome bonus text overlay for self-contained banners. */
  hideOverlay?: boolean;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  id: string;
  label: string;
  href: string;
}

export interface SportEvent {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  isLive: boolean;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  homeScore?: number;
  awayScore?: number;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  badge: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}
