import type { BlogPost, FaqItem, Game, Promotion, SportEvent } from "@/types";

/* ---------- Casino / Slots / Live Casino / Esports game catalogues ---------- */

export const CASINO_GAMES: Game[] = [
  { id: "c-baccarat", title: "BACCARAT", provider: "Evolution", category: "table", isFree: false },
  { id: "c-roulette", title: "EUROPEAN ROULETTE", provider: "Pragmatic Play", category: "table", isFree: false },
  { id: "c-blackjack", title: "BLACKJACK", provider: "Playtech", category: "table", isFree: false },
  { id: "c-dragon", title: "DRAGON TIGER", provider: "SA Gaming", category: "table", isFree: true },
  { id: "c-sic-bo", title: "SIC BO", provider: "JILI", category: "table", isFree: false },
  { id: "c-craps", title: "CRAPS", provider: "Evolution", category: "table", isFree: false },
  { id: "c-andar", title: "ANDAR BAHAR", provider: "Ezugi", category: "table", isFree: true },
  { id: "c-poker", title: "CASINO HOLD'EM", provider: "Playtech", category: "table", isFree: false },
  { id: "c-wheel", title: "MONEY WHEEL", provider: "Pragmatic Play", category: "table", isFree: true },
  { id: "c-fan-tan", title: "FAN TAN", provider: "Evolution", category: "table", isFree: false },
  { id: "c-teen", title: "TEEN PATTI", provider: "Ezugi", category: "table", isFree: true },
  { id: "c-war", title: "CASINO WAR", provider: "SA Gaming", category: "table", isFree: false },
];

export const SLOT_GAMES: Game[] = [
  { id: "s-fortune", title: "FORTUNE GEMS", provider: "JILI", category: "slots", isFree: true },
  { id: "s-buffalo", title: "BUFFALO KING", provider: "Pragmatic Play", category: "slots", isFree: false },
  { id: "s-gates", title: "GATES OF OLYMPUS", provider: "Pragmatic Play", category: "slots", isFree: true },
  { id: "s-starlight", title: "STARLIGHT PRINCESS", provider: "Pragmatic Play", category: "slots", isFree: false },
  { id: "s-sweet", title: "SWEET BONANZA", provider: "Pragmatic Play", category: "slots", isFree: true },
  { id: "s-wolf", title: "WOLF GOLD", provider: "Pragmatic Play", category: "slots", isFree: false },
  { id: "s-wild", title: "WILD WEST GOLD", provider: "Pragmatic Play", category: "slots", isFree: true },
  { id: "s-aztec", title: "AZTEC GEMS", provider: "Pragmatic Play", category: "slots", isFree: false },
  { id: "s-golden", title: "GOLDEN EMPIRE", provider: "JILI", category: "slots", isFree: true },
  { id: "s-mega", title: "MEGA MOOLAH", provider: "Megah5", category: "slots", isFree: false },
  { id: "s-pharaoh", title: "PHARAOH'S FORTUNE", provider: "Playtech", category: "slots", isFree: true },
  { id: "s-book", title: "BOOK OF DEAD", provider: "Hacksaw Gaming", category: "slots", isFree: false },
  { id: "s-fire88", title: "FIRE 88", provider: "Pragmatic Play", category: "slots", isFree: true },
  { id: "s-lucky7", title: "LUCKY 7", provider: "JILI", category: "slots", isFree: false },
  { id: "s-boxing", title: "BOXING KING", provider: "JILI", category: "slots", isFree: true },
];

export const LIVE_CASINO_GAMES: Game[] = [
  { id: "lc-bac", title: "LIVE BACCARAT", provider: "Evolution", category: "live-casino", isFree: false },
  { id: "lc-roul", title: "LIVE ROULETTE", provider: "Pragmatic Play", category: "live-casino", isFree: false },
  { id: "lc-bj", title: "LIVE BLACKJACK", provider: "Evolution", category: "live-casino", isFree: false },
  { id: "lc-crazy", title: "CRAZY TIME", provider: "Evolution", category: "live-casino", isFree: false },
  { id: "lc-mono", title: "MONOPOLY LIVE", provider: "Evolution", category: "live-casino", isFree: false },
  { id: "lc-dream", title: "DREAM CATCHER", provider: "Evolution", category: "live-casino", isFree: false },
  { id: "lc-deal", title: "DEAL OR NO DEAL", provider: "Evolution", category: "live-casino", isFree: false },
  { id: "lc-sic", title: "LIVE SIC BO", provider: "Ezugi", category: "live-casino", isFree: false },
  { id: "lc-teen", title: "LIVE TEEN PATTI", provider: "Ezugi", category: "live-casino", isFree: false },
  { id: "lc-speed", title: "SPEED BACCARAT", provider: "SA Gaming", category: "live-casino", isFree: false },
  { id: "lc-light", title: "LIGHTNING ROULETTE", provider: "Evolution", category: "live-casino", isFree: false },
  { id: "lc-dragon", title: "LIVE DRAGON TIGER", provider: "SA Gaming", category: "live-casino", isFree: false },
];

export const ESPORTS_GAMES: Game[] = [
  { id: "e-lol", title: "LEAGUE OF LEGENDS", provider: "Esports", category: "arcade", isFree: false },
  { id: "e-dota", title: "DOTA 2", provider: "Esports", category: "arcade", isFree: false },
  { id: "e-csgo", title: "CS2", provider: "Esports", category: "arcade", isFree: false },
  { id: "e-val", title: "VALORANT", provider: "Esports", category: "arcade", isFree: false },
  { id: "e-ow", title: "OVERWATCH 2", provider: "Esports", category: "arcade", isFree: false },
  { id: "e-pubg", title: "PUBG", provider: "Esports", category: "arcade", isFree: false },
  { id: "e-fifa", title: "EA FC 25", provider: "Esports", category: "arcade", isFree: false },
  { id: "e-mlbb", title: "MOBILE LEGENDS", provider: "Esports", category: "arcade", isFree: false },
  { id: "e-kog", title: "KING OF GLORY", provider: "Esports", category: "arcade", isFree: false },
  { id: "e-apex", title: "APEX LEGENDS", provider: "Esports", category: "arcade", isFree: false },
  { id: "e-rl", title: "ROCKET LEAGUE", provider: "Esports", category: "arcade", isFree: false },
  { id: "e-sc2", title: "STARCRAFT 2", provider: "Esports", category: "arcade", isFree: false },
];

/* ---------- Sports events ---------- */

export const SPORT_EVENTS: SportEvent[] = [
  { id: "se-1", sport: "Football", league: "Premier League", homeTeam: "Arsenal", awayTeam: "Chelsea", startTime: "Today 20:00", isLive: true, homeOdds: 1.85, drawOdds: 3.6, awayOdds: 4.2, homeScore: 1, awayScore: 0 },
  { id: "se-2", sport: "Football", league: "La Liga", homeTeam: "Barcelona", awayTeam: "Real Madrid", startTime: "Today 22:00", isLive: false, homeOdds: 2.1, drawOdds: 3.4, awayOdds: 3.5 },
  { id: "se-3", sport: "Football", league: "Serie A", homeTeam: "AC Milan", awayTeam: "Inter Milan", startTime: "Tomorrow 21:00", isLive: false, homeOdds: 2.65, drawOdds: 3.2, awayOdds: 2.7 },
  { id: "se-4", sport: "Basketball", league: "NBA", homeTeam: "Lakers", awayTeam: "Celtics", startTime: "Today 07:30", isLive: true, homeOdds: 1.75, drawOdds: 0, awayOdds: 2.1, homeScore: 88, awayScore: 92 },
  { id: "se-5", sport: "Basketball", league: "NBA", homeTeam: "Warriors", awayTeam: "Bucks", startTime: "Tomorrow 10:00", isLive: false, homeOdds: 1.95, drawOdds: 0, awayOdds: 1.85 },
  { id: "se-6", sport: "Tennis", league: "ATP Finals", homeTeam: "Djokovic", awayTeam: "Sinner", startTime: "Today 18:00", isLive: false, homeOdds: 2.2, drawOdds: 0, awayOdds: 1.7 },
  { id: "se-7", sport: "Cricket", league: "IPL", homeTeam: "Mumbai Indians", awayTeam: "Chennai Super Kings", startTime: "Tomorrow 15:30", isLive: false, homeOdds: 1.9, drawOdds: 0, awayOdds: 1.9 },
  { id: "se-8", sport: "Football", league: "Bundesliga", homeTeam: "Bayern Munich", awayTeam: "Dortmund", startTime: "Tomorrow 19:30", isLive: false, homeOdds: 1.55, drawOdds: 4.2, awayOdds: 5.5 },
];

export const SPORT_CATEGORIES = [
  { id: "all", label: "All Sports", icon: "Trophy" as const },
  { id: "football", label: "Football", icon: "CircleDot" as const },
  { id: "basketball", label: "Basketball", icon: "Target" as const },
  { id: "tennis", label: "Trophy" as const, icon: "Trophy" as const },
  { id: "cricket", label: "Cricket", icon: "Shield" as const },
] as const;

/* ---------- Promotions ---------- */

export const PROMOTIONS: Promotion[] = [
  { id: "promo-1", title: "100% Welcome Bonus", description: "Get a 100% match bonus on your first deposit up to $500. Start your journey with double the funds!", badge: "NEW", ctaLabel: "Claim Now", ctaHref: "/promotion" },
  { id: "promo-2", title: "Weekly Cashback", description: "Receive up to 15% cashback on your weekly net losses. The more you play, the more you get back.", badge: "HOT", ctaLabel: "Learn More", ctaHref: "/promotion" },
  { id: "promo-3", title: "50 Free Spins", description: "Play our featured slot games with 50 free spins, no deposit required. New players only.", badge: "FREE", ctaLabel: "Spin Now", ctaHref: "/promotion" },
  { id: "promo-4", title: "Refer a Friend", description: "Earn $25 for every friend you refer who makes a qualifying deposit. No limit on referrals!", badge: "EARN", ctaLabel: "Refer Now", ctaHref: "/promotion" },
  { id: "promo-5", title: "VIP Reload Bonus", description: "Exclusive 50% reload bonus for VIP members on every deposit. Loyalty has its rewards.", badge: "VIP", ctaLabel: "Deposit", ctaHref: "/promotion" },
  { id: "promo-6", title: "Live Casino Tournament", description: "Compete in our weekly live casino tournament for a share of the $10,000 prize pool.", badge: "LIVE", ctaLabel: "Join Now", ctaHref: "/promotion" },
];

/* ---------- Blog posts ---------- */

export const BLOG_POSTS: BlogPost[] = [
  { id: "blog-1", title: "Top 10 Slot Strategies for Beginners", excerpt: "Master the basics of slot gaming with these essential tips that every new player should know before spinning the reels.", date: "2026-11-08", category: "Guides", readTime: "5 min" },
  { id: "blog-2", title: "Understanding Live Casino Etiquette", excerpt: "Learn the unwritten rules of live casino gaming. From dealer interactions to bet timing, here's everything you need to know.", date: "2026-11-06", category: "Live Casino", readTime: "4 min" },
  { id: "blog-3", title: "Sports Betting: A Complete Guide", excerpt: "From reading odds to understanding handicaps, this guide covers everything you need to start sports betting with confidence.", date: "2026-11-04", category: "Sports", readTime: "7 min" },
  { id: "blog-4", title: "VIP Program: How to Level Up Fast", excerpt: "Discover the fastest ways to climb through our VIP tiers and unlock exclusive rewards and higher cashback rates.", date: "2026-11-02", category: "VIP", readTime: "3 min" },
  { id: "blog-5", title: "Responsible Gaming: Setting Your Limits", excerpt: "Gaming should always be fun. Learn how to set deposit limits, take breaks, and recognise the signs of problem gambling.", date: "2026-10-30", category: "Responsible Gaming", readTime: "4 min" },
  { id: "blog-6", title: "New Games This Month", excerpt: "Explore the latest additions to our game library, including exciting new slots, table games, and live casino experiences.", date: "2026-10-28", category: "News", readTime: "3 min" },
];

/* ---------- FAQ items ---------- */

export const FAQ_ITEMS: FaqItem[] = [
  { id: "faq-1", question: "How do I create an account?", answer: "Click the 'Sign Up' button in the top right corner. Fill in your details, verify your email address, and your account will be ready. You must be 18 or older to register.", category: "Account" },
  { id: "faq-2", question: "What payment methods do you accept?", answer: "We accept Visa, Mastercard, bKash, Rocket, Upay, Skrill, Neteller, PayPal, and USDT. Processing times vary by method — e-wallets are usually instant, while bank transfers can take 1-3 business days.", category: "Payments" },
  { id: "faq-3", question: "How do I make a deposit?", answer: "Log in to your account, go to your Profile, and click 'Deposit'. Choose your preferred payment method, enter the amount, and follow the instructions. Minimum deposit is $10.", category: "Payments" },
  { id: "faq-4", question: "How long do withdrawals take?", answer: "Withdrawal times depend on the payment method. E-wallets: 0-24 hours. Bank transfers: 1-3 business days. Cryptocurrency: 0-1 hour. All withdrawals undergo a security review.", category: "Payments" },
  { id: "faq-5", question: "What is the VIP program?", answer: "Our VIP program rewards loyal players with exclusive bonuses, higher cashback rates, a personal account manager, and priority withdrawals. You progress through tiers automatically as you play.", category: "VIP" },
  { id: "faq-5b", question: "How many VIP levels are there?", answer: "There are multiple VIP tiers, each with increasing rewards. As you play and deposit, you automatically progress through the levels. Higher tiers unlock better cashback rates, faster withdrawals, and exclusive promotions.", category: "VIP" },
  { id: "faq-6", question: "Are the games fair?", answer: "All our games use certified Random Number Generators (RNG) and are regularly audited by independent testing agencies. We are committed to fair and transparent gaming.", category: "Games" },
  { id: "faq-6b", question: "Which game providers do you offer?", answer: "We partner with top providers including Pragmatic Play, Evolution, JILI, PG Soft, Playtech, Hacksaw Gaming, and many more. Our library features hundreds of slots, table games, and live dealer experiences.", category: "Games" },
  { id: "faq-7", question: "How do I claim a bonus?", answer: "Navigate to the Promotions page, find an offer you like, and click 'Claim Now'. Some bonuses are applied automatically on deposit, while others require a promo code. Check each promotion's terms for details.", category: "Bonuses" },
  { id: "faq-7b", question: "What are wagering requirements?", answer: "Wagering requirements specify how many times you must wager your bonus amount before you can withdraw winnings. For example, a 30x requirement on a $10 bonus means you need to place $300 in bets. Check each promotion's terms for specific requirements.", category: "Bonuses" },
  { id: "faq-8", question: "What should I do if I forget my password?", answer: "Click 'Log In', then select 'Forgot Password'. Enter your registered email address and we'll send you a reset link. For security, the link expires after 30 minutes.", category: "Account" },
  { id: "faq-9", question: "Is my personal information safe?", answer: "We use industry-standard SSL encryption and adhere to strict data protection policies. Your personal and financial information is never shared with third parties without your consent.", category: "Security" },
  { id: "faq-9b", question: "Do you support two-factor authentication?", answer: "Yes, we strongly recommend enabling two-factor authentication (2FA) on your account for additional security. You can set it up in your Profile under the Settings tab.", category: "Security" },
  { id: "faq-10", question: "How do I contact customer support?", answer: "You can reach us 24/7 through our live chat, email at support@tcl11.com, or through our Contact page. Our support team typically responds within minutes.", category: "Support" },
  { id: "faq-10b", question: "What languages does support speak?", answer: "Our support team can assist you in English, Bengali, Hindi, and several other languages. If you need help in a specific language, let our team know at the start of the conversation.", category: "Support" },
];
