/* Static mock content for the design system and the first UI pass.
 * All values are copied from the reference image. Replace with real data in Step 06+. */

import type {
  FooterColumn,
  Game,
  NavItem,
  PaymentMethod,
  PromotionContent,
  SocialLink,
  Transaction,
  VipStatus,
} from "@/types";
import { BN } from "@/i18n/bn";

export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: BN.nav.home, href: "/", icon: "House" },
  { id: "hot-games", label: BN.nav.hotGames, href: "/hot-games", icon: "Flame" },
  { id: "featured-games", label: BN.nav.featuredGames, href: "/featured-games", icon: "Star" },
  { id: "slots", label: BN.nav.slots, href: "/slots", icon: "Gift" },
  { id: "fishing", label: BN.nav.fishing, href: "/fishing", icon: "Zap" },
  { id: "live-casino", label: BN.nav.live, href: "/live-casino", icon: "Tv" },
  { id: "sports", label: BN.nav.sports, href: "/sports", icon: "Trophy" },
  { id: "esports", label: BN.nav.esports, href: "/esports", icon: "Gamepad2" },
  { id: "poker", label: BN.nav.poker, href: "/poker", icon: "Dices" },
  { id: "lottery", label: BN.nav.lottery, href: "/lottery", icon: "Target" },
];

export const MOBILE_TABS: NavItem[] = [
  { id: "home", label: BN.nav.home, href: "/", icon: "House" },
  { id: "casino", label: BN.nav.casino, href: "/casino", icon: "Dices" },
  { id: "sports", label: BN.nav.sports, href: "/sports", icon: "Trophy" },
  { id: "promotion", label: BN.nav.promotion, href: "/promotion", icon: "Gift" },
  { id: "profile", label: BN.nav.profile, href: "/profile", icon: "User" },
];

export const POPULAR_CATEGORIES = [
  { id: "all", label: "All Games" },
  { id: "slots", label: "Slots" },
  { id: "table", label: "Table" },
  { id: "live-casino", label: "Live Casino" },
  { id: "fishing", label: "Fishing" },
  { id: "arcade", label: "Arcade" },
] as const;

export const POPULAR_GAMES: Game[] = [
  { id: "p-slot", title: "SLOT", provider: "TCL11", category: "slots", isFree: false },
  { id: "p-bonza", title: "BONZA", provider: "TCL11", category: "slots", isFree: false },
  { id: "p-aristocrat", title: "ARISTOCRAT", provider: "TCL11", category: "slots", isFree: false },
  { id: "p-live", title: "LIVE", provider: "TCL11", category: "live-casino", isFree: false },
];

export const FEATURED_GAMES: Game[] = [
  { id: "f-megah5", title: "MEGAH5", provider: "MEGAH5", category: "slots", isFree: true },
  { id: "f-bcoongo", title: "bcoongo", provider: "bcoongo", category: "slots", isFree: true },
  { id: "f-uu", title: "UU SLOTS", provider: "UU Slots", category: "slots", isFree: true },
  { id: "f-playtech", title: "PLAYTECH", provider: "Playtech", category: "table", isFree: true },
  { id: "f-pragmatic", title: "PRAGMATIC PLAY", provider: "Pragmatic Play", category: "slots", isFree: true },
  { id: "f-pg", title: "PG POCKET GAMES SOFT", provider: "PG Soft", category: "slots", isFree: true },
  { id: "f-jili", title: "JILI", provider: "JILI", category: "slots", isFree: true },
  { id: "f-joker", title: "JOKER", provider: "Joker", category: "slots", isFree: true },
  { id: "f-hacksaw", title: "HACKSAW GAMING", provider: "Hacksaw Gaming", category: "slots", isFree: true },
  { id: "f-evoplay", title: "EVOPLAY", provider: "Evoplay", category: "arcade", isFree: true },
];

export const WELCOME_PROMO: PromotionContent = {
  eyebrow: "Welcome Bonus",
  title: "GET 100%",
  highlight: "WELCOME BONUS",
  subtitle: "On Your First Deposit",
  ctaLabel: "Claim Now",
  ctaHref: "/promotion",
};

export const SPORTS_PROMO: PromotionContent = {
  eyebrow: "Sports",
  title: "Sports",
  highlight: "Betting",
  subtitle: "Bet on Your Favorite Teams",
  ctaLabel: "Bet Now",
  ctaHref: "/sports",
};

export const VIP_STATUS: VipStatus = {
  level: 0,
  nextLevel: 1,
  progress: 0.25,
  remainingToUpgrade: 0,
  locked: true,
};

export const TRANSACTIONS: Transaction[] = [
  { id: "t1", userId: "G*****518", type: "ADD", amount: 24.0, currency: "AUD", status: "SUCCESS" },
  { id: "t2", userId: "G*****984", type: "ADD", amount: 13.25, currency: "AUD", status: "SUCCESS" },
  { id: "t3", userId: "G*****436", type: "ADD", amount: 50.0, currency: "AUD", status: "SUCCESS" },
  { id: "t4", userId: "G*****721", type: "ADD", amount: 5.3, currency: "AUD", status: "WIN" },
  { id: "t5", userId: "G*****613", type: "ADD", amount: 9.0, currency: "AUD", status: "SUCCESS" },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "visa", name: "VISA" },
  { id: "mastercard", name: "Mastercard" },
  { id: "bkash", name: "bKash" },
  { id: "unidentified-orange", name: "TBC" },
  { id: "rocket", name: "Rocket" },
  { id: "upay", name: "Upay" },
  { id: "skrill", name: "Skrill" },
  { id: "neteller", name: "NETELLER" },
  { id: "paypal", name: "PayPal" },
  { id: "usdt", name: "USDT" },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: BN.footer.quickLinks,
    links: [
      { label: BN.nav.home, href: "/" },
      { label: BN.nav.about, href: "/about" },
      { label: BN.nav.blog, href: "/blog" },
      { label: BN.nav.faq, href: "/faq" },
      { label: BN.nav.referral, href: "/referral" },
    ],
  },
  {
    title: BN.footer.games,
    links: [
      { label: BN.nav.casino, href: "/casino" },
      { label: BN.nav.slots, href: "/slots" },
      { label: BN.nav.liveCasino, href: "/live-casino" },
      { label: BN.nav.sports, href: "/sports" },
      { label: BN.nav.fishing, href: "/fishing" },
    ],
  },
  {
    title: BN.footer.helpSupport,
    links: [
      { label: BN.nav.contact, href: "/contact" },
      { label: "Live Chat", href: "/chat" },
      { label: BN.nav.notifications, href: "/notifications" },
      { label: BN.nav.terms, href: "/terms" },
      { label: BN.nav.privacy, href: "/privacy" },
      { label: BN.nav.responsibleGaming, href: "/responsible-gaming" },
    ],
  },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { id: "youtube", label: "YouTube", href: "#" },
  { id: "facebook", label: "Facebook", href: "#" },
  { id: "telegram", label: "Telegram", href: "#" },
  { id: "instagram", label: "Instagram", href: "#" },
  { id: "tiktok", label: "TikTok", href: "#" },
];

export const WHY_CHOOSE_FEATURES = [
  { id: "safe", label: "নিরাপদ ও সুরক্ষিত", icon: "ShieldCheck" },
  { id: "fast", label: "দ্রুত ডিপোজিট ও উত্তোলন", icon: "Zap" },
  { id: "support", label: "২৪/৭ সাপোর্ট", icon: "Headset" },
  { id: "bonus", label: "দৈনিক বোনাস", icon: "Gift" },
] as const;
