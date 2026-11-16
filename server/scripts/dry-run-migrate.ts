import { pgClient, MODELS } from './migration-config';

async function dryRun() {
  console.log('--- Dry-Run Migration Validation Started ---');
  let modelsInspected = 0;
  let recordsSampled = 0;
  const errors: string[] = [];
  const warnings: string[] = [];
  const financialDataValidation = { checked: 0, issues: 0 };

  for (const modelName of MODELS) {
    modelsInspected++;
    console.log(`\nInspecting model: ${modelName}`);

    // 1. Fetch sample from PG (Read-only)
    const records = await (pgClient as any)[modelName].findMany({
      take: 5,
      orderBy: { id: 'asc' },
    });

    recordsSampled += records.length;
    console.log(`  Fetched ${records.length} sample records.`);

    for (const record of records) {
      // 2. Validate User.roles (Array to JSON)
      if (modelName === 'user' && record.roles) {
        if (!Array.isArray(record.roles)) {
          errors.push(`[User] Roles field is not an array: ${typeof record.roles}`);
        } else {
          try {
            JSON.stringify(record.roles);
          } catch (e) {
            errors.push(`[User] Roles field is not JSON-serializable`);
          }
        }
      }

      // 3. Validate financial precision
      const financialFields = ['amount', 'totalDeposits', 'totalWithdrawals', 'availableBalance', 'reservedBalance', 'homeOdds', 'drawOdds', 'awayOdds'];
      for (const field of financialFields) {
        if (record[field] !== undefined && record[field] !== null) {
          financialDataValidation.checked++;
          // Prisma Decimal should not be a number if we want to preserve precision
          if (typeof record[field] === 'number') {
             warnings.push(`[Finance] Financial field ${field} in ${modelName} is a JavaScript number (possible loss of precision).`);
             financialDataValidation.issues++;
          }
        }
      }

      // 4. UUID & Schema Check (simplified)
      if (record.id && record.id.length < 32 && !record.id.includes('-')) {
          warnings.push(`[Schema] ID '${record.id}' length suggests it might not be a standard UUID in model ${modelName}`);
      }
    }
  }

  // 5. Foreign Key Dependency Analysis (based on MODElS order)
  const fkReport = `Foreign Key Dependency Order: ${MODELS.join(' -> ')}`;

  // 6. SkipDuplicates Analysis
  const skipDuplicatesRisk = `Analysis: The current migration uses 'skipDuplicates: true'. Risk: If a batch fails partially, records already inserted will be silently skipped on retry, leading to silent data loss if the migration state (lastId) was not perfectly synchronized with successful writes.`;

  console.log('\n--- Validation Results ---');
  console.log(`Models inspected: ${modelsInspected}`);
  console.log(`Records sampled: ${recordsSampled}`);
  console.log(`Financial data checked: ${financialDataValidation.checked}, Potential issues: ${financialDataValidation.issues}`);
  console.log(fkReport);
  console.log(skipDuplicatesRisk);

  if (errors.length > 0) {
      console.error('Errors found:', errors);
  }
  if (warnings.length > 0) {
      console.warn('Warnings found:', warnings);
  }

  console.log('\n--- Dry-Run Validation Complete. No data was written. ---');
}

dryRun().catch(console.error).finally(async () => {
  await pgClient.$disconnect();
});
