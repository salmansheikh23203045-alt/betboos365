/**
 * Production-safe seed — CONTENT ONLY.
 *
 * What this script does:
 *   • Creates game providers (studios)
 *   • Creates games
 *   • Creates sports, leagues, teams and a couple of upcoming matches
 *   • Creates promotions
 *
 * What this script DOES NOT do (deliberate):
 *   • No user accounts. Production users sign up through `/signup` with a
 *     password of their choosing (bcrypt-hashed server-side).
 *   • No notifications, tickets or audit logs — those are per-user and must
 *     be created by real activity, not seed data.
 *   • No `Test1234` or any other hardcoded credential.
 *
 * Everything is idempotent via `upsert` on unique slugs, so re-running on
 * a populated DB is safe. Nothing is deleted.
 *
 * Usage:
 *   npm run prisma:seed:prod       # locally against the configured DB
 *   # on Railway (one-off job):    npx prisma db seed  (with PRISMA_SEED_CMD override, see docs)
 */
import {
  PrismaClient,
  GameCategory,
  PromotionStatus,
  SportStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[seed:prod] Seeding content-only data…');

  // ── Game providers ─────────────────────────
  // Both `name` and `slug` are unique on GameProvider. Match by name first
  // (the canonical identity) so historic rows that picked a different slug
  // aren't duplicated into a constraint violation.
  async function upsertProvider(name: string, slug: string) {
    const existing = await prisma.gameProvider.findUnique({ where: { name } });
    if (existing) return existing;
    return prisma.gameProvider.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
  }
  const pragmatic = await upsertProvider('Pragmatic Play', 'pragmatic-play');
  const evolution = await upsertProvider('Evolution', 'evolution');
  const jili = await upsertProvider('JILI', 'jili');
  const playtech = await upsertProvider('Playtech', 'playtech');
  const esportsProvider = await upsertProvider('Esports', 'esports');
  console.log('  Providers: 5');

  // ── Games ──────────────────────────────────
  const gameData = [
    { title: 'FORTUNE GEMS', slug: 'fortune-gems', category: GameCategory.slots, providerId: pragmatic.id, isFree: false, sortOrder: 1 },
    { title: 'SUPER ACE', slug: 'super-ace', category: GameCategory.slots, providerId: jili.id, isFree: false, sortOrder: 2 },
    { title: 'SWEET BONANZA', slug: 'sweet-bonanza', category: GameCategory.slots, providerId: pragmatic.id, isFree: true, sortOrder: 3 },
    { title: 'GATES OF OLYMPUS', slug: 'gates-of-olympus', category: GameCategory.slots, providerId: pragmatic.id, isFree: false, sortOrder: 4 },
    { title: 'STARLIGHT PRINCESS', slug: 'starlight-princess', category: GameCategory.slots, providerId: pragmatic.id, isFree: false, sortOrder: 5 },
    { title: 'MONEY COMING', slug: 'money-coming', category: GameCategory.slots, providerId: jili.id, isFree: false, sortOrder: 6 },
    { title: 'TEEN PATTI', slug: 'teen-patti', category: GameCategory.table, providerId: evolution.id, isFree: false, sortOrder: 7 },
    { title: 'BLACKJACK', slug: 'blackjack', category: GameCategory.table, providerId: playtech.id, isFree: false, sortOrder: 8 },
    { title: 'LIVE BACCARAT', slug: 'live-baccarat', category: GameCategory.live_casino, providerId: evolution.id, isFree: false, sortOrder: 9 },
    { title: 'CRAZY TIME', slug: 'crazy-time', category: GameCategory.live_casino, providerId: evolution.id, isFree: false, sortOrder: 10 },
    { title: 'LIVE ROULETTE', slug: 'live-roulette', category: GameCategory.live_casino, providerId: pragmatic.id, isFree: false, sortOrder: 11 },
    { title: 'LEAGUE OF LEGENDS', slug: 'league-of-legends', category: GameCategory.esports, providerId: esportsProvider.id, isFree: false, sortOrder: 12 },
    { title: 'DOTA 2', slug: 'dota-2', category: GameCategory.esports, providerId: esportsProvider.id, isFree: false, sortOrder: 13 },
    { title: 'CS2', slug: 'cs2', category: GameCategory.esports, providerId: esportsProvider.id, isFree: false, sortOrder: 14 },
  ];
  for (const g of gameData) {
    await prisma.game.upsert({ where: { slug: g.slug }, update: {}, create: g });
  }
  console.log(`  Games: ${gameData.length}`);

  // ── Sports / Leagues / Teams ───────────────
  const football = await prisma.sport.upsert({ where: { slug: 'football' }, update: {}, create: { name: 'Football', slug: 'football' } });
  const basketball = await prisma.sport.upsert({ where: { slug: 'basketball' }, update: {}, create: { name: 'Basketball', slug: 'basketball' } });
  const tennis = await prisma.sport.upsert({ where: { slug: 'tennis' }, update: {}, create: { name: 'Tennis', slug: 'tennis' } });
  const cricket = await prisma.sport.upsert({ where: { slug: 'cricket' }, update: {}, create: { name: 'Cricket', slug: 'cricket' } });

  const epl = await prisma.league.upsert({ where: { slug: 'english-premier-league' }, update: {}, create: { name: 'English Premier League', slug: 'english-premier-league', sportId: football.id, country: 'England' } });
  const laLiga = await prisma.league.upsert({ where: { slug: 'la-liga' }, update: {}, create: { name: 'La Liga', slug: 'la-liga', sportId: football.id, country: 'Spain' } });
  const nba = await prisma.league.upsert({ where: { slug: 'nba' }, update: {}, create: { name: 'NBA', slug: 'nba', sportId: basketball.id, country: 'USA' } });
  await prisma.league.upsert({ where: { slug: 'atp-tour' }, update: {}, create: { name: 'ATP Tour', slug: 'atp-tour', sportId: tennis.id } });
  const ipl = await prisma.league.upsert({ where: { slug: 'ipl' }, update: {}, create: { name: 'Indian Premier League', slug: 'ipl', sportId: cricket.id, country: 'India' } });
  console.log('  Leagues: 5');

  const teamSlugs = [
    ['manchester-united', 'Manchester United'],
    ['liverpool', 'Liverpool'],
    ['arsenal', 'Arsenal'],
    ['chelsea', 'Chelsea'],
    ['real-madrid', 'Real Madrid'],
    ['barcelona', 'Barcelona'],
    ['la-lakers', 'LA Lakers'],
    ['golden-state-warriors', 'Golden State Warriors'],
    ['boston-celtics', 'Boston Celtics'],
    ['miami-heat', 'Miami Heat'],
    ['mumbai-indians', 'Mumbai Indians'],
    ['chennai-super-kings', 'Chennai Super Kings'],
  ] as const;
  const teams: Record<string, { id: string }> = {};
  for (const [slug, name] of teamSlugs) {
    teams[slug] = await prisma.team.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }
  console.log(`  Teams: ${teamSlugs.length}`);

  // ── Matches — UPCOMING only ────────────────
  // Live/finished scores are historical; seeding them at launch would be
  // misleading. Matches for the opening day are synthetic placeholders the
  // owner replaces when the sports feed is wired.
  const now = new Date();
  const hour = 3600000;
  const matchData = [
    { leagueId: epl.id, homeTeamId: teams['arsenal'].id, awayTeamId: teams['chelsea'].id, startTime: new Date(now.getTime() + 24 * hour), status: SportStatus.upcoming, homeOdds: 1.85, drawOdds: 3.50, awayOdds: 3.80 },
    { leagueId: laLiga.id, homeTeamId: teams['barcelona'].id, awayTeamId: teams['real-madrid'].id, startTime: new Date(now.getTime() + 48 * hour), status: SportStatus.upcoming, homeOdds: 2.20, drawOdds: 3.25, awayOdds: 2.90 },
    { leagueId: nba.id, homeTeamId: teams['la-lakers'].id, awayTeamId: teams['golden-state-warriors'].id, startTime: new Date(now.getTime() + 36 * hour), status: SportStatus.upcoming, homeOdds: 1.75, drawOdds: 0, awayOdds: 2.05 },
    { leagueId: ipl.id, homeTeamId: teams['mumbai-indians'].id, awayTeamId: teams['chennai-super-kings'].id, startTime: new Date(now.getTime() + 72 * hour), status: SportStatus.upcoming, homeOdds: 1.90, drawOdds: 0, awayOdds: 1.90 },
  ];
  // Avoid duplicating matches when re-running: only create those that don't
  // already exist for this (leagueId, homeTeamId, awayTeamId) tuple.
  for (const m of matchData) {
    const existing = await prisma.sportMatch.findFirst({
      where: { leagueId: m.leagueId, homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId, status: SportStatus.upcoming },
    });
    if (!existing) {
      await prisma.sportMatch.create({ data: m });
    }
  }
  console.log(`  Upcoming matches: ${matchData.length}`);

  // ── Promotions ─────────────────────────────
  // Idempotency on promotions: title is not unique in the schema, so we
  // pre-check by title and only create missing ones.
  const promoData = [
    { title: '100% WELCOME BONUS', description: 'Get a 100% match bonus on your first deposit up to $500.', badge: 'NEW', ctaLabel: 'Claim Now', ctaHref: '/promotion', status: PromotionStatus.ACTIVE, startDate: now, endDate: new Date(now.getTime() + 30 * 86400000), minVipLevel: 0 },
    { title: 'WEEKLY CASHBACK', description: 'Receive up to 15% cashback on your weekly net losses.', badge: 'HOT', ctaLabel: 'Learn More', ctaHref: '/promotion', status: PromotionStatus.ACTIVE, startDate: now, endDate: new Date(now.getTime() + 90 * 86400000), minVipLevel: 0 },
    { title: '50 FREE SPINS', description: 'Play our featured slot games with 50 free spins.', badge: 'FREE', ctaLabel: 'Spin Now', ctaHref: '/slots', status: PromotionStatus.ACTIVE, startDate: now, endDate: new Date(now.getTime() + 14 * 86400000), minVipLevel: 0 },
    { title: 'REFER A FRIEND', description: 'Earn $25 for every friend you refer who makes a qualifying deposit.', badge: 'EARN', ctaLabel: 'Refer Now', ctaHref: '/promotion', status: PromotionStatus.ACTIVE, startDate: now, endDate: new Date(now.getTime() + 365 * 86400000), minVipLevel: 0 },
    { title: 'VIP RELOAD BONUS', description: 'Exclusive 50% reload bonus available for VIP members.', badge: 'VIP', ctaLabel: 'Reload', ctaHref: '/promotion', status: PromotionStatus.ACTIVE, startDate: now, endDate: new Date(now.getTime() + 60 * 86400000), minVipLevel: 3 },
    { title: 'LIVE CASINO TOURNAMENT', description: 'Compete for a $10,000 prize pool in our weekly tournament.', badge: 'LIVE', ctaLabel: 'Join Now', ctaHref: '/live-casino', status: PromotionStatus.ACTIVE, startDate: now, endDate: new Date(now.getTime() + 7 * 86400000), minVipLevel: 1 },
  ];
  let promoCreated = 0;
  for (const p of promoData) {
    const existing = await prisma.promotion.findFirst({ where: { title: p.title } });
    if (!existing) {
      await prisma.promotion.create({ data: p });
      promoCreated++;
    }
  }
  console.log(`  Promotions: ${promoCreated} created, ${promoData.length - promoCreated} already present`);

  console.log('[seed:prod] Done. No user accounts were created.');
  console.log('[seed:prod] To create the first admin: sign up via /signup, then run `npm run admin:promote -- <username>` from a Railway shell.');
}

main()
  .catch((e) => {
    console.error('[seed:prod] Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
