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

export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", href: "/", icon: "House" },
  { id: "casino", label: "Casino", href: "/casino", icon: "Dices" },
  { id: "slots", label: "Slots", href: "/slots", icon: "Gift" },
  { id: "live-casino", label: "Live Casino", href: "/live-casino", icon: "Tv" },
  { id: "sports", label: "Sports", href: "/sports", icon: "Trophy" },
  { id: "esports", label: "Esports", href: "/esports", icon: "Gamepad2" },
  { id: "promotion", label: "Promotion", href: "/promotion", icon: "Gift" },
];

export const MOBILE_TABS: NavItem[] = [
  { id: "home", label: "Home", href: "/", icon: "House" },
  { id: "casino", label: "Casino", href: "/casino", icon: "Dices" },
  { id: "sports", label: "Sports", href: "/sports", icon: "Trophy" },
  { id: "promotion", label: "Promotion", href: "/promotion", icon: "Gift" },
  { id: "profile", label: "Profile", href: "/profile", icon: "User" },
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
    title: "Quick Links",
    links: [
      { label: "Home", href: "/" },
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Games",
    links: [
      { label: "Casino", href: "/casino" },
      { label: "Slots", href: "/slots" },
      { label: "Live Casino", href: "/live-casino" },
      { label: "Sports", href: "/sports" },
    ],
  },
  {
    title: "Help & Support",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Live Chat", href: "/chat" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
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
  { id: "safe", label: "Safe & Secure", icon: "ShieldCheck" },
  { id: "fast", label: "Fast Deposit & Withdraw", icon: "Zap" },
  { id: "support", label: "24/7 Support", icon: "Headset" },
  { id: "bonus", label: "Daily Bonus", icon: "Gift" },
] as const;
