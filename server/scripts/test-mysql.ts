import { PrismaClient } from '../node_modules/.prisma/client-mysql';

const client = new PrismaClient({
  datasources: { db: { url: 'mysql://root:secret@localhost:3307/tcl_staging' } },
});

async function test() {
  try {
    await client.$connect();
    console.log('Successfully connected to MySQL staging database (tcl_staging).');
    await client.$disconnect();
  } catch (e) {
    console.error('Failed to connect:', e);
    process.exit(1);
  }
}
test();
