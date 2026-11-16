// ETL Configuration and Constants
import { PrismaClient as PgClient } from '../node_modules/.prisma/client-pg';
import { PrismaClient as MysqlClient } from '../node_modules/.prisma/client-mysql';

export const BATCH_SIZE = 5;

export const pgClient = new PgClient({
  datasources: { db: { url: process.env.PG_DATABASE_URL || process.env.DATABASE_URL } },
});

export const mysqlClient = new MysqlClient({
  datasources: { db: { url: process.env.MYSQL_DATABASE_URL } },
});

// Model loading order based on dependency graph
export const MODELS = [
  'gameProvider', 'sport', 'paymentProvider', // Level 1
  'game', 'league',                         // Level 2
  'team', 'user',                           // Level 3
  'userProfile', 'wallet', 'supportTicket', 'notification', 'promotion', 'sportMatch', // Level 4
  'walletTransaction', 'ticketMessage', 'userPromotion', 'gameLaunch', 'auditLog', 'contactSubmission', 'depositRequest', 'withdrawalRequest' // Level 5
];
