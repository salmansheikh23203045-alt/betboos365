import { PrismaClient, UserRole, GameCategory, PromotionStatus, SportStatus, NotificationType, AuditAction, TicketPriority, TicketStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Users ──────────────────────────────────
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash('Test1234', salt);

  const demoUser = await prisma.user.upsert({
    where: { username: 'demo' },
    update: { email: 'demo@tcl11.com' },
    create: {
      username: 'demo',
      email: 'demo@tcl11.com',
      passwordHash: hash,
      firstName: 'Demo',
      lastName: 'User',
      phone: '+8801234567890',
      roles: [UserRole.user],
      profile: {
        create: {
          displayName: 'Demo User',
          vipLevel: 0,
          gamesPlayed: 47,
        },
      },
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { email: 'admin@tcl11.com' },
    create: {
      username: 'admin',
      email: 'admin@tcl11.com',
      passwordHash: hash,
      firstName: 'Admin',
      lastName: 'TCL11',
      phone: '+8801234567891',
      roles: [UserRole.admin, UserRole.user],
      profile: {
        create: {
          displayName: 'Admin TCL11',
          vipLevel: 5,
        },
      },
    },
  });

  const vipUser = await prisma.user.upsert({
    where: { username: 'vip' },
    update: { email: 'vip@tcl11.com' },
    create: {
      username: 'vip',
      email: 'vip@tcl11.com',
      passwordHash: hash,
      firstName: 'Sarah',
      lastName: 'Chen',
      phone: '+8801234567892',
      roles: [UserRole.vip, UserRole.user],
      profile: {
        create: {
          displayName: 'Sarah C.',
          vipLevel: 3,
          gamesPlayed: 312,
          totalDeposits: 5000.00,
          totalWithdrawals: 2300.00,
          activeBonuses: 2,
        },
      },
    },
  });

  const modUser = await prisma.user.upsert({
    where: { username: 'mod' },
    update: { email: 'mod@tcl11.com' },
    create: {
      username: 'mod',
      email: 'mod@tcl11.com',
      passwordHash: hash,
      firstName: 'James',
      lastName: 'Wilson',
      phone: '+8801234567893',
      roles: [UserRole.moderator, UserRole.user],
      profile: {
        create: {
          displayName: 'James W.',
          vipLevel: 1,
        },
      },
    },
  });

  console.log(`  Users: ${demoUser.id}, ${adminUser.id}, ${vipUser.id}, ${modUser.id}`);

  // ── Game Providers ─────────────────────────
  const providers = await Promise.all([
    prisma.gameProvider.upsert({ where: { slug: 'pragmatic-play' }, update: {}, create: { name: 'Pragmatic Play', slug: 'pragmatic-play' } }),
    prisma.gameProvider.upsert({ where: { slug: 'evolution' }, update: {}, create: { name: 'Evolution', slug: 'evolution' } }),
    prisma.gameProvider.upsert({ where: { slug: 'jili' }, update: {}, create: { name: 'JILI', slug: 'jili' } }),
    prisma.gameProvider.upsert({ where: { slug: 'playtech' }, update: {}, create: { name: 'Playtech', slug: 'playtech' } }),
    prisma.gameProvider.upsert({ where: { slug: 'esports-provider' }, update: {}, create: { name: 'Esports', slug: 'esports-provider' } }),
  ]);
  const [pragmatic, evolution, jili, playtech, esportsProvider] = providers;
  console.log(`  Providers: ${providers.length}`);

  // ── Games ──────────────────────────────────
  const gameData = [
    { title: 'FORTUNE GEMS', slug: 'fortune-gems', category: GameCategory.slots, providerId: jili.id, isFree: true, sortOrder: 1 },
    { title: 'BUFFALO KING', slug: 'buffalo-king', category: GameCategory.slots, providerId: pragmatic.id, isFree: false, sortOrder: 2 },
    { title: 'GATES OF OLYMPUS', slug: 'gates-of-olympus', category: GameCategory.slots, providerId: pragmatic.id, isFree: true, sortOrder: 3 },
    { title: 'SWEET BONANZA', slug: 'sweet-bonanza', category: GameCategory.slots, providerId: pragmatic.id, isFree: true, sortOrder: 4 },
    { title: 'WOLF GOLD', slug: 'wolf-gold', category: GameCategory.slots, providerId: pragmatic.id, isFree: false, sortOrder: 5 },
    { title: 'BACCARAT', slug: 'baccarat', category: GameCategory.table, providerId: evolution.id, isFree: false, sortOrder: 6 },
    { title: 'EUROPEAN ROULETTE', slug: 'european-roulette', category: GameCategory.table, providerId: pragmatic.id, isFree: false, sortOrder: 7 },
    { title: 'BLACKJACK', slug: 'blackjack', category: GameCategory.table, providerId: playtech.id, isFree: false, sortOrder: 8 },
    { title: 'LIVE BACCARAT', slug: 'live-baccarat', category: GameCategory.live_casino, providerId: evolution.id, isFree: false, sortOrder: 9 },
    { title: 'CRAZY TIME', slug: 'crazy-time', category: GameCategory.live_casino, providerId: evolution.id, isFree: false, sortOrder: 10 },
    { title: 'LIVE ROULETTE', slug: 'live-roulette', category: GameCategory.live_casino, providerId: pragmatic.id, isFree: false, sortOrder: 11 },
    { title: 'LEAGUE OF LEGENDS', slug: 'league-of-legends', category: GameCategory.esports, providerId: esportsProvider.id, isFree: false, sortOrder: 12 },
    { title: 'DOTA 2', slug: 'dota-2', category: GameCategory.esports, providerId: esportsProvider.id, isFree: false, sortOrder: 13 },
    { title: 'CS2', slug: 'cs2', category: GameCategory.esports, providerId: esportsProvider.id, isFree: false, sortOrder: 14 },
  ];

  for (const g of gameData) {
    await prisma.game.upsert({
      where: { slug: g.slug },
      update: {},
      create: g,
    });
  }
  console.log(`  Games: ${gameData.length}`);

  // ── Sports / Leagues / Teams / Matches ─────
  const football = await prisma.sport.upsert({ where: { slug: 'football' }, update: {}, create: { name: 'Football', slug: 'football' } });
  const basketball = await prisma.sport.upsert({ where: { slug: 'basketball' }, update: {}, create: { name: 'Basketball', slug: 'basketball' } });
  const tennis = await prisma.sport.upsert({ where: { slug: 'tennis' }, update: {}, create: { name: 'Tennis', slug: 'tennis' } });
  const cricket = await prisma.sport.upsert({ where: { slug: 'cricket' }, update: {}, create: { name: 'Cricket', slug: 'cricket' } });

  const epl = await prisma.league.upsert({ where: { slug: 'english-premier-league' }, update: {}, create: { name: 'English Premier League', slug: 'english-premier-league', sportId: football.id, country: 'England' } });
  const laLiga = await prisma.league.upsert({ where: { slug: 'la-liga' }, update: {}, create: { name: 'La Liga', slug: 'la-liga', sportId: football.id, country: 'Spain' } });
  const nba = await prisma.league.upsert({ where: { slug: 'nba' }, update: {}, create: { name: 'NBA', slug: 'nba', sportId: basketball.id, country: 'USA' } });
  const atpTour = await prisma.league.upsert({ where: { slug: 'atp-tour' }, update: {}, create: { name: 'ATP Tour', slug: 'atp-tour', sportId: tennis.id } });
  const ipl = await prisma.league.upsert({ where: { slug: 'ipl' }, update: {}, create: { name: 'Indian Premier League', slug: 'ipl', sportId: cricket.id, country: 'India' } });

  const teams = await Promise.all([
    prisma.team.upsert({ where: { slug: 'manchester-united' }, update: {}, create: { name: 'Manchester United', slug: 'manchester-united' } }),
    prisma.team.upsert({ where: { slug: 'liverpool' }, update: {}, create: { name: 'Liverpool', slug: 'liverpool' } }),
    prisma.team.upsert({ where: { slug: 'arsenal' }, update: {}, create: { name: 'Arsenal', slug: 'arsenal' } }),
    prisma.team.upsert({ where: { slug: 'chelsea' }, update: {}, create: { name: 'Chelsea', slug: 'chelsea' } }),
    prisma.team.upsert({ where: { slug: 'real-madrid' }, update: {}, create: { name: 'Real Madrid', slug: 'real-madrid' } }),
    prisma.team.upsert({ where: { slug: 'barcelona' }, update: {}, create: { name: 'Barcelona', slug: 'barcelona' } }),
    prisma.team.upsert({ where: { slug: 'la-lakers' }, update: {}, create: { name: 'LA Lakers', slug: 'la-lakers' } }),
    prisma.team.upsert({ where: { slug: 'golden-state-warriors' }, update: {}, create: { name: 'Golden State Warriors', slug: 'golden-state-warriors' } }),
    prisma.team.upsert({ where: { slug: 'boston-celtics' }, update: {}, create: { name: 'Boston Celtics', slug: 'boston-celtics' } }),
    prisma.team.upsert({ where: { slug: 'miami-heat' }, update: {}, create: { name: 'Miami Heat', slug: 'miami-heat' } }),
    prisma.team.upsert({ where: { slug: 'mumbai-indians' }, update: {}, create: { name: 'Mumbai Indians', slug: 'mumbai-indians' } }),
    prisma.team.upsert({ where: { slug: 'chennai-super-kings' }, update: {}, create: { name: 'Chennai Super Kings', slug: 'chennai-super-kings' } }),
  ]);
  const [manUtd, liverpool, arsenal, chelsea, realMadrid, barcelona, lakers, warriors, celtics, heat, mumbai, chennai] = teams;

  const now = new Date();
  const hour = 3600000;

  const matchData = [
    { leagueId: epl.id, homeTeamId: manUtd.id, awayTeamId: liverpool.id, startTime: new Date(now.getTime() - 1 * hour), status: SportStatus.live, homeScore: 1, awayScore: 2, homeOdds: 2.10, drawOdds: 3.40, awayOdds: 2.80 },
    { leagueId: epl.id, homeTeamId: arsenal.id, awayTeamId: chelsea.id, startTime: new Date(now.getTime() + 3 * hour), status: SportStatus.upcoming, homeOdds: 1.85, drawOdds: 3.50, awayOdds: 3.80 },
    { leagueId: laLiga.id, homeTeamId: realMadrid.id, awayTeamId: barcelona.id, startTime: new Date(now.getTime() - 0.5 * hour), status: SportStatus.live, homeScore: 0, awayScore: 0, homeOdds: 1.95, drawOdds: 3.30, awayOdds: 3.50 },
    { leagueId: laLiga.id, homeTeamId: barcelona.id, awayTeamId: realMadrid.id, startTime: new Date(now.getTime() + 48 * hour), status: SportStatus.upcoming, homeOdds: 2.20, drawOdds: 3.25, awayOdds: 2.90 },
    { leagueId: nba.id, homeTeamId: lakers.id, awayTeamId: warriors.id, startTime: new Date(now.getTime() + 6 * hour), status: SportStatus.upcoming, homeOdds: 1.75, drawOdds: 0, awayOdds: 2.05 },
    { leagueId: nba.id, homeTeamId: celtics.id, awayTeamId: heat.id, startTime: new Date(now.getTime() - 2 * hour), status: SportStatus.finished, homeScore: 112, awayScore: 105, homeOdds: 1.60, drawOdds: 0, awayOdds: 2.30 },
    { leagueId: ipl.id, homeTeamId: mumbai.id, awayTeamId: chennai.id, startTime: new Date(now.getTime() + 24 * hour), status: SportStatus.upcoming, homeOdds: 1.90, drawOdds: 0, awayOdds: 1.90 },
  ];

  for (const m of matchData) {
    await prisma.sportMatch.create({ data: m });
  }
  console.log(`  Sport matches: ${matchData.length}`);

  // ── Promotions ─────────────────────────────
  const promoData = [
    { title: '100% WELCOME BONUS', description: 'Get a 100% match bonus on your first deposit up to $500.', badge: 'NEW', ctaLabel: 'Claim Now', ctaHref: '/promotion', status: PromotionStatus.ACTIVE, startDate: now, endDate: new Date(now.getTime() + 30 * 86400000), minVipLevel: 0 },
    { title: 'WEEKLY CASHBACK', description: 'Receive up to 15% cashback on your weekly net losses.', badge: 'HOT', ctaLabel: 'Learn More', ctaHref: '/promotion', status: PromotionStatus.ACTIVE, startDate: now, endDate: new Date(now.getTime() + 90 * 86400000), minVipLevel: 0 },
    { title: '50 FREE SPINS', description: 'Play our featured slot games with 50 free spins.', badge: 'FREE', ctaLabel: 'Spin Now', ctaHref: '/slots', status: PromotionStatus.ACTIVE, startDate: now, endDate: new Date(now.getTime() + 14 * 86400000), minVipLevel: 0 },
    { title: 'REFER A FRIEND', description: 'Earn $25 for every friend you refer who makes a qualifying deposit.', badge: 'EARN', ctaLabel: 'Refer Now', ctaHref: '/promotion', status: PromotionStatus.ACTIVE, startDate: now, endDate: new Date(now.getTime() + 365 * 86400000), minVipLevel: 0 },
    { title: 'VIP RELOAD BONUS', description: 'Exclusive 50% reload bonus available for VIP members.', badge: 'VIP', ctaLabel: 'Reload', ctaHref: '/promotion', status: PromotionStatus.ACTIVE, startDate: now, endDate: new Date(now.getTime() + 60 * 86400000), minVipLevel: 3 },
    { title: 'LIVE CASINO TOURNAMENT', description: 'Compete for a $10,000 prize pool in our weekly tournament.', badge: 'LIVE', ctaLabel: 'Join Now', ctaHref: '/live-casino', status: PromotionStatus.ACTIVE, startDate: now, endDate: new Date(now.getTime() + 7 * 86400000), minVipLevel: 1 },
  ];

  for (const p of promoData) {
    await prisma.promotion.create({ data: p });
  }
  console.log(`  Promotions: ${promoData.length}`);

  // ── Notifications ──────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: demoUser.id, type: NotificationType.system, title: 'Welcome to TCL11!', message: 'Your account has been created. Explore our games and sports offerings.' },
      { userId: demoUser.id, type: NotificationType.promotion, title: 'Welcome Bonus Available', message: 'Claim your 100% welcome bonus on your first deposit.' },
      { userId: vipUser.id, type: NotificationType.account, title: 'VIP Level Upgraded', message: 'Congratulations! You have been promoted to VIP Level 3.' },
      { userId: vipUser.id, type: NotificationType.promotion, title: 'Exclusive VIP Offer', message: 'A 50% reload bonus is now available for you.' },
      { userId: adminUser.id, type: NotificationType.system, title: 'System Update', message: 'Platform maintenance completed. All systems operational.' },
    ],
  });
  console.log('  Notifications: 5');

  // ── Support Tickets ────────────────────────
  const ticket1 = await prisma.supportTicket.create({
    data: {
      userId: demoUser.id,
      subject: 'Cannot access my account settings',
      priority: TicketPriority.medium,
      status: TicketStatus.open,
      messages: {
        create: {
          senderId: demoUser.id,
          senderRole: 'user',
          message: 'I am unable to access my account settings page. It shows a blank screen after login.',
        },
      },
    },
  });

  const ticket2 = await prisma.supportTicket.create({
    data: {
      userId: vipUser.id,
      subject: 'VIP bonus not credited',
      priority: TicketPriority.high,
      status: TicketStatus.in_progress,
      messages: {
        createMany: {
          data: [
            { senderId: vipUser.id, senderRole: 'user', message: 'I claimed the VIP reload bonus 2 hours ago but it has not been credited to my account.' },
            { senderId: modUser.id, senderRole: 'agent', message: 'Thank you for reaching out. I am looking into your bonus claim right now. Please allow me a few minutes.' },
          ],
        },
      },
    },
  });
  console.log(`  Tickets: ${ticket1.id}, ${ticket2.id}`);

  // ── Audit Logs ─────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { action: AuditAction.REGISTER, userId: demoUser.id, metadata: { method: 'email' }, ipAddress: '203.0.113.10', userAgent: 'Mozilla/5.0' },
      { action: AuditAction.LOGIN, userId: demoUser.id, metadata: {}, ipAddress: '203.0.113.10', userAgent: 'Mozilla/5.0' },
      { action: AuditAction.REGISTER, userId: vipUser.id, metadata: { method: 'email' }, ipAddress: '198.51.100.22', userAgent: 'Mozilla/5.0' },
      { action: AuditAction.LOGIN, userId: adminUser.id, metadata: {}, ipAddress: '192.0.2.1', userAgent: 'Mozilla/5.0' },
      { action: AuditAction.ADMIN_ACTION, userId: adminUser.id, metadata: { target: vipUser.id, action: 'vip_upgrade' }, ipAddress: '192.0.2.1', userAgent: 'Mozilla/5.0' },
      { action: AuditAction.GAME_LAUNCH, userId: demoUser.id, metadata: { gameSlug: 'fortune-gems' }, ipAddress: '203.0.113.10', userAgent: 'Mozilla/5.0' },
      { action: AuditAction.SUPPORT_TICKET, userId: demoUser.id, metadata: { ticketId: ticket1.id }, ipAddress: '203.0.113.10', userAgent: 'Mozilla/5.0' },
    ],
  });
  console.log('  Audit logs: 7');

  // ── Contact Submissions ────────────────────
  await prisma.contactSubmission.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      subject: 'Partnership inquiry',
      message: 'I would like to discuss a potential partnership opportunity with TCL11.',
      referenceId: 'contact-seed-001',
    },
  });
  console.log('  Contact submissions: 1');

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
