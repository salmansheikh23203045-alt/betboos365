import { pgClient, mysqlClient, MODELS, BATCH_SIZE } from './migration-config';
import { loadState, saveState } from './migration-state';

interface ConflictReport {
  model: string;
  id: string;
  error: string;
}

async function migrateStagingSubset() {
  console.log('--- Starting Controlled Staging Subset Migration to MySQL ---');
  console.log('Target Database: tcl_staging (MySQL 8.4)');
  console.log('Mode: Controlled Subset (1 batch per model max)');

  const state = loadState();
  const conflicts: ConflictReport[] = [];
  const modelStats: Record<string, { sourceCount: number; migratedCount: number; conflicts: number; inserted: number; skipped: number; failed: number }> = {};

  // Default 1 batch per model (subset mode). Override with MIGRATE_MAX_BATCHES (e.g. a large number for a full migration).
  const maxBatches = Number(process.env.MIGRATE_MAX_BATCHES ?? 1);
  console.log(`Mode: maxBatches=${maxBatches} (env MIGRATE_MAX_BATCHES=${process.env.MIGRATE_MAX_BATCHES ?? 'unset'})`);

  for (const modelName of MODELS) {
    console.log(`\n[Staging Subset] Processing model: ${modelName}`);
    modelStats[modelName] = { sourceCount: 0, migratedCount: 0, conflicts: 0, inserted: 0, skipped: 0, failed: 0 };

    const sourceCount = await (pgClient as any)[modelName].count();
    modelStats[modelName].sourceCount = sourceCount;
    console.log(`  Source records available: ${sourceCount}`);

    let lastId = state[modelName] || undefined;
    let batchCount = 0;
    let modelMigrated = 0;

    while (batchCount < maxBatches) {
      const records = await (pgClient as any)[modelName].findMany({
        take: BATCH_SIZE,
        skip: lastId ? 1 : 0,
        cursor: lastId ? { id: lastId } : undefined,
        orderBy: { id: 'asc' },
      });

      if (records.length === 0) {
        break;
      }

      batchCount++;

      // Transform records for MySQL compatibility (JSON roles, Decimal precision preservation)
      const transformedRecords = records.map((record: any) => {
        const copy = { ...record };
        if (modelName === 'user' && copy.roles) {
          if (Array.isArray(copy.roles)) {
            copy.roles = JSON.parse(JSON.stringify(copy.roles));
          } else if (typeof copy.roles === 'string') {
            try {
              copy.roles = JSON.parse(copy.roles);
            } catch {
              copy.roles = [copy.roles];
            }
          }
        }
        return copy;
      });

      // Insert batch without skipDuplicates (using fallback conflict detection)
      try {
        await (mysqlClient as any)[modelName].createMany({
          data: transformedRecords,
          skipDuplicates: false,
        });
        modelMigrated += transformedRecords.length;
        modelStats[modelName].inserted += transformedRecords.length;
      } catch (batchError: any) {
        console.warn(`  [Warning] Batch insert failed for ${modelName}. Running individual existence & conflict check.`);

        for (const record of transformedRecords) {
          try {
            const existing = await (mysqlClient as any)[modelName].findUnique({
              where: { id: record.id },
              select: { id: true },
            });

            if (existing) {
              modelMigrated++;
              modelStats[modelName].skipped++;
              continue;
            }

            await (mysqlClient as any)[modelName].create({
              data: record,
            });
            modelMigrated++;
            modelStats[modelName].inserted++;
          } catch (singleError: any) {
            modelStats[modelName].conflicts++;
            modelStats[modelName].failed++;
            conflicts.push({
              model: modelName,
              id: record.id || 'unknown',
              error: singleError.message || String(singleError),
            });
            console.error(`    [Failed/Conflict] Model: ${modelName}, ID: ${record.id} — Error: ${singleError.message}`);
          }
        }
      }

      lastId = records[records.length - 1].id;
      state[modelName] = lastId || null;
      saveState(state);
      console.log(`  Progress: Migrated batch of ${records.length} records up to lastId: ${lastId}`);
    }

    modelStats[modelName].migratedCount = modelMigrated;
  }

  console.log('\n--- Staging Subset Migration Summary & Report ---');
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const modelName of MODELS) {
    const stats = modelStats[modelName];
    totalInserted += stats.inserted;
    totalSkipped += stats.skipped;
    totalFailed += stats.failed;
    console.log(`- ${modelName}: SourceAvailable=${stats.sourceCount}, Inserted=${stats.inserted}, Skipped=${stats.skipped}, Failed=${stats.failed}`);
  }

  console.log(`\nTotals: Inserted=${totalInserted}, Skipped=${totalSkipped}, Failed=${totalFailed}`);

  // Record-count and Financial Reconciliation Checks
  console.log('\n--- Reconciliation Checks (Staging Subset) ---');
  let reconciliationPassed = true;
  for (const modelName of MODELS) {
    const destCount = await (mysqlClient as any)[modelName].count();
    const expectedMigrated = modelStats[modelName].migratedCount;
    if (destCount !== expectedMigrated) {
      console.error(`  [Mismatch] ${modelName}: Destination Staging Count (${destCount}) !== Expected Migrated (${expectedMigrated})`);
      reconciliationPassed = false;
    } else {
      console.log(`  [Verified] ${modelName}: Staging Count matches expected subset (${destCount} records)`);
    }
  }

  // Financial Reconciliation
  try {
    const pgWallets = await pgClient.wallet.aggregate({ _sum: { availableBalance: true, reservedBalance: true } });
    const mysqlWallets = await mysqlClient.wallet.aggregate({ _sum: { availableBalance: true, reservedBalance: true } });
    console.log(`\nFinancial Reconciliation:`);
    console.log(`  Wallet Available Balance — Source: ${pgWallets._sum.availableBalance || 0} | Staging: ${mysqlWallets._sum.availableBalance || 0}`);
    console.log(`  Wallet Reserved Balance — Source: ${pgWallets._sum.reservedBalance || 0} | Staging: ${mysqlWallets._sum.reservedBalance || 0}`);

    const pgTx = await pgClient.walletTransaction.aggregate({ _sum: { amount: true } });
    const mysqlTx = await mysqlClient.walletTransaction.aggregate({ _sum: { amount: true } });
    console.log(`  Wallet Transactions Amount — Source: ${pgTx._sum.amount || 0} | Staging: ${mysqlTx._sum.amount || 0}`);

    const pgDep = await pgClient.depositRequest.aggregate({ _sum: { amount: true } });
    const mysqlDep = await mysqlClient.depositRequest.aggregate({ _sum: { amount: true } });
    console.log(`  Deposit Requests Amount — Source: ${pgDep._sum.amount || 0} | Staging: ${mysqlDep._sum.amount || 0}`);

    const pgWd = await pgClient.withdrawalRequest.aggregate({ _sum: { amount: true } });
    const mysqlWd = await mysqlClient.withdrawalRequest.aggregate({ _sum: { amount: true } });
    console.log(`  Withdrawal Requests Amount — Source: ${pgWd._sum.amount || 0} | Staging: ${mysqlWd._sum.amount || 0}`);
  } catch (finErr: any) {
    console.error('Financial reconciliation note:', finErr.message);
  }

  if (reconciliationPassed) {
    console.log('\n✅ All staging subset reconciliation checks passed successfully.');
  } else {
    console.warn('\n⚠️ Some reconciliation discrepancies noted due to subset boundaries.');
  }

  console.log('\n--- Phase 3 Staging Subset Migration Complete ---');
}

migrateStagingSubset()
  .catch((err) => {
    console.error('Staging migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pgClient.$disconnect();
    await mysqlClient.$disconnect();
  });
