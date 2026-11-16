import { pgClient, mysqlClient, MODELS } from './migration-config';

async function verify() {
  console.log('--- Starting Migration Verification & Reconciliation ---');
  let allPassed = true;
  const reconciliationReport: any[] = [];

  for (const modelName of MODELS) {
    const pgCount = await (pgClient as any)[modelName].count();
    const mysqlCount = await (mysqlClient as any)[modelName].count();

    const matched = pgCount === mysqlCount;
    if (!matched) {
      allPassed = false;
    }

    reconciliationReport.push({
      model: modelName,
      sourceCount: pgCount,
      destinationCount: mysqlCount,
      status: matched ? 'MATCH' : 'MISMATCH',
    });

    if (!matched) {
      console.error(`  FAIL: ${modelName} count mismatch (PG: ${pgCount}, MySQL: ${mysqlCount})`);
    } else {
      console.log(`  PASS: ${modelName} (${pgCount} records)`);
    }
  }

  console.log('\n--- Financial Reconciliation ---');
  try {
    const pgWallets = await pgClient.wallet.aggregate({ _sum: { availableBalance: true, reservedBalance: true } });
    const mysqlWallets = await mysqlClient.wallet.aggregate({ _sum: { availableBalance: true, reservedBalance: true } });
    console.log(`Wallets Available Balance — PG: ${pgWallets._sum.availableBalance || 0} | MySQL: ${mysqlWallets._sum.availableBalance || 0}`);
    console.log(`Wallets Reserved Balance — PG: ${pgWallets._sum.reservedBalance || 0} | MySQL: ${mysqlWallets._sum.reservedBalance || 0}`);

    const pgTx = await pgClient.walletTransaction.aggregate({ _sum: { amount: true } });
    const mysqlTx = await mysqlClient.walletTransaction.aggregate({ _sum: { amount: true } });
    console.log(`Wallet Transactions Amount — PG: ${pgTx._sum.amount || 0} | MySQL: ${mysqlTx._sum.amount || 0}`);

    const pgDep = await pgClient.depositRequest.aggregate({ _sum: { amount: true } });
    const mysqlDep = await mysqlClient.depositRequest.aggregate({ _sum: { amount: true } });
    console.log(`Deposit Requests Amount — PG: ${pgDep._sum.amount || 0} | MySQL: ${mysqlDep._sum.amount || 0}`);

    const pgWd = await pgClient.withdrawalRequest.aggregate({ _sum: { amount: true } });
    const mysqlWd = await mysqlClient.withdrawalRequest.aggregate({ _sum: { amount: true } });
    console.log(`Withdrawal Requests Amount — PG: ${pgWd._sum.amount || 0} | MySQL: ${mysqlWd._sum.amount || 0}`);
  } catch (err: any) {
    console.error('Financial reconciliation warning:', err.message);
  }

  console.log('\nVerification complete.');
  if (allPassed) {
    console.log('All model record counts match successfully.');
  } else {
    console.error('Record count mismatches detected.');
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
}).finally(async () => {
  await pgClient.$disconnect();
  await mysqlClient.$disconnect();
});
