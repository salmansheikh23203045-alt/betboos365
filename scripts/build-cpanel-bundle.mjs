#!/usr/bin/env node
/**
 * Builds a self-contained upload bundle for a cPanel "Setup Node.js App"
 * (CloudLinux / Passenger) deployment.
 *
 *   node scripts/build-cpanel-bundle.mjs
 *
 * Output: dist-cpanel/            folder to upload as the application root
 *         dist-cpanel.tar.gz      same, as one archive (extract in File Manager)
 *
 * The server has no shell, so everything that needs a compiler happens here:
 *   - Next.js production build (.next, without the build cache)
 *   - NestJS backend compiled to server/dist
 *   - maintenance scripts (migrations helper, staff bootstrap, content seed,
 *     wallet integrity check, Telegram webhook) compiled to plain JS
 * On the server, "Run NPM Install" installs production dependencies only and
 * runs `prisma generate` for the server's own Linux/OpenSSL.
 *
 * No secrets are read or written: environment variables are set in cPanel.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist-cpanel');
const run = (cmd, cwd = root) => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
};
const copy = (from, to = from, filter) =>
  fs.cpSync(path.join(root, from), path.join(out, to), { recursive: true, filter });

// 1. Generate the Prisma client (incl. the rhel-* Linux engines from
//    schema.prisma binaryTargets), compile the backend, build the frontend.
//    The Prisma CLI cannot run on the CloudLinux host (its WebAssembly module
//    exceeds the account memory limit), so the client ships prebuilt.
run('npx prisma generate --schema=prisma/schema.prisma', path.join(root, 'server'));
run('npx tsc -p tsconfig.build.json', path.join(root, 'server'));
run('npx next build --webpack');

// 2. Fresh output folder.
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// 3. Runtime files.
// Leave out the build cache and anything a dev server left behind (.next/dev
// holds symlinks into node_modules); keep only what `next start` reads.
const nextDir = path.join(root, '.next');
copy('.next', '.next', (src) => {
  const rel = path.relative(nextDir, src);
  const top = rel.split(path.sep)[0];
  return top !== 'cache' && top !== 'dev' && !src.endsWith('.map');
});
copy('public');
copy('server/dist', 'server/dist', (src) => !src.endsWith('.map') && !src.endsWith('.d.ts'));
copy('server/prisma/schema.prisma');
copy('server/prisma/migrations');
// Prebuilt Prisma client; scripts/install-prisma-client.js puts it in place.
const generated = path.join(root, 'server', 'node_modules', '.prisma', 'client');
for (const t of ['debian-openssl-1.0.x', 'debian-openssl-1.1.x', 'debian-openssl-3.0.x']) {
  if (!fs.existsSync(path.join(generated, `libquery_engine-${t}.so.node`))) {
    throw new Error(`Prisma engine for ${t} missing; check binaryTargets in schema.prisma`);
  }
}
fs.cpSync(generated, path.join(out, 'prisma-client'), {
  recursive: true,
  // The Windows engine is useless on the Linux server.
  filter: (src) => !/query_engine-windows/.test(src),
});

// 4. Maintenance scripts → plain JS (CommonJS) in scripts/.
// Paths are relative to server/, where tsc runs (it uses server/node_modules types).
const scripts = [
  'scripts/setup-server-secrets.ts',
  'scripts/apply-migrations.ts',
  'prisma/bootstrap-staff.ts',
  'prisma/seed.prod.ts',
  'scripts/check-wallet-integrity.ts',
  'scripts/telegram-set-webhook.ts',
];
run(
  `npx tsc ${scripts.join(' ')} --outDir "${path.join(out, 'scripts')}" --module commonjs --target ES2022 ` +
    '--esModuleInterop --skipLibCheck --strict --noEmitOnError',
  path.join(root, 'server'),
);
// tsc mirrors the common folder; flatten to scripts/<name>.js
const flat = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) flat(p);
    else if (dir !== path.join(out, 'scripts')) fs.renameSync(p, path.join(out, 'scripts', e.name));
  }
};
flat(path.join(out, 'scripts'));
for (const e of fs.readdirSync(path.join(out, 'scripts'), { withFileTypes: true })) {
  if (e.isDirectory()) fs.rmSync(path.join(out, 'scripts', e.name), { recursive: true });
}
fs.writeFileSync(
  path.join(out, 'scripts', 'load-secrets.js'),
  `// Loads server-generated secrets (written by setup-server-secrets.js) into
// process.env. Variables already set in cPanel win. Never prints values.
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '..', '.bb365-secrets.json');
if (fs.existsSync(file)) {
  const secrets = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [k, v] of Object.entries(secrets)) {
    if (k !== 'createdAt' && typeof v === 'string' && !process.env[k]) process.env[k] = v;
  }
}
`,
);
fs.writeFileSync(
  path.join(out, 'scripts', 'deploy-tasks.js'),
  `// One-shot deployment tasks, triggered by an uploaded marker file.
// Upload an empty file named ".run-deploy-tasks" to the app root, then press
// "Restart" in cPanel. On start, app.js calls this: the marker is claimed
// atomically (only one process wins), the tasks run in order, output goes to
// deploy-tasks.log, and the marker is removed. Without the marker it does nothing.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const MARKER = path.join(ROOT, '.run-deploy-tasks');
const CLAIMED = MARKER + '.running';
const LOG = path.join(ROOT, 'deploy-tasks.log');

const TASKS = [
  // First: put the prebuilt Prisma client in place (npm installs can leave a stub).
  ['prisma client', 'scripts/install-prisma-client.js', []],
  ['migrations', 'scripts/apply-migrations.js', []],
  ['content seed', 'scripts/seed.prod.js', []],
  ['staff accounts', 'scripts/bootstrap-staff.js', ['--generate']],
  ['wallet integrity', 'scripts/check-wallet-integrity.js', []],
];

module.exports = function runDeployTasks() {
  try {
    fs.renameSync(MARKER, CLAIMED);
  } catch {
    return; // no marker, or another process claimed it
  }
  const log = (s) => fs.appendFileSync(LOG, s + '\\n');
  log('==== deploy tasks ' + new Date().toISOString() + ' ====');
  for (const [label, script, args] of TASKS) {
    const r = spawnSync(process.execPath, ['-r', './scripts/load-secrets.js', script, ...args], {
      cwd: ROOT,
      env: process.env,
      encoding: 'utf8',
      timeout: 5 * 60 * 1000,
    });
    log('--- ' + label + ' (exit ' + r.status + ')');
    log((r.stdout || '') + (r.stderr || ''));
    if (r.status !== 0) {
      log('Stopped: ' + label + ' failed. Fix the cause, upload the marker again and restart.');
      break;
    }
  }
  log('==== done ' + new Date().toISOString() + ' ====');
  fs.rmSync(CLAIMED, { force: true });
};
`,
);
fs.writeFileSync(
  path.join(out, 'scripts', 'install-prisma-client.js'),
  `// Copies the prebuilt Prisma client (./prisma-client) to where @prisma/client
// loads it from (node_modules/.prisma/client). Run after every "Run NPM Install":
// npm can leave a placeholder client there, and the Prisma CLI cannot run on
// this host to regenerate it.
const fs = require('node:fs');
const path = require('node:path');
const src = path.join(__dirname, '..', 'prisma-client');
const pkgDir = path.dirname(require.resolve('@prisma/client/package.json', { paths: [path.join(__dirname, '..')] }));
const dest = path.join(pkgDir, '..', '..', '.prisma', 'client');
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
const engines = fs.readdirSync(dest).filter((f) => f.startsWith('libquery_engine-'));
console.log('[prisma-client] installed to', dest);
console.log('[prisma-client] engines:', engines.join(', '));
`,
);

// 5. Runtime Next config (no build-only tracing options, no TypeScript needed).
const rootPkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
fs.writeFileSync(
  path.join(out, 'next.config.js'),
  `// Runtime config for \`next start\` on cPanel. Mirrors next.config.ts.
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: { formats: ['image/avif', 'image/webp'] },
  serverExternalPackages: ${JSON.stringify(
    [
      '@nestjs/core', '@nestjs/common', '@nestjs/config', '@nestjs/jwt', '@nestjs/passport',
      '@nestjs/platform-express', '@nestjs/platform-socket.io', '@nestjs/swagger', '@nestjs/throttler',
      '@nestjs/websockets', '@prisma/client', '.prisma/client', 'prisma', 'bcrypt', 'class-transformer',
      'class-validator', 'helmet', 'ioredis', 'passport', 'passport-jwt', 'reflect-metadata', 'uuid', 'express',
    ],
  )},
};
`,
);

// 6. Passenger startup file.
fs.writeFileSync(
  path.join(out, 'app.js'),
  `// Passenger / cPanel "Application startup file".
// Serves the Next.js app; the NestJS API is mounted inside it at /api/v1.
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
require('./scripts/load-secrets');
// Runs migrations/seed/staff setup once if a ".run-deploy-tasks" marker was uploaded.
require('./scripts/deploy-tasks')();
const { createServer } = require('node:http');
const next = require('next');

const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(process.env.PORT || 3000, () => {
      console.log('[betboos365] ready');
    });
  })
  .catch((err) => {
    console.error('[betboos365] failed to start:', err);
    process.exit(1);
  });
`,
);

// 7. Production package.json: runtime deps + prisma CLI; no build steps.
// Runtime dependencies only. The Prisma CLI is left out on purpose: it cannot
// run on the CloudLinux host, and the client it would generate ships prebuilt.
const deps = { ...rootPkg.dependencies };
fs.writeFileSync(
  path.join(out, 'package.json'),
  JSON.stringify(
    {
      name: 'betboos365-app',
      version: rootPkg.version,
      private: true,
      description: 'BetBoos365 production bundle (built by scripts/build-cpanel-bundle.mjs)',
      engines: { node: '>=20.9' },
      scripts: {
        start: 'node app.js',
        // No postinstall: the Prisma CLI cannot run on CloudLinux (WASM memory
        // limit). The client ships prebuilt; migrations use the runtime client.
        'prisma:install-client': 'node scripts/install-prisma-client.js',
        // Creates the DB user + JWT secret on the server; nobody types a secret.
        'setup:secrets': 'node scripts/setup-server-secrets.js',
        'db:migrate': 'node -r ./scripts/load-secrets.js scripts/apply-migrations.js',
        'db:status': 'node -r ./scripts/load-secrets.js scripts/apply-migrations.js --status',
        'db:seed-content': 'node -r ./scripts/load-secrets.js scripts/seed.prod.js',
        // Random temporary passwords → ~/bb365-initial-logins.txt (mode 600).
        'staff:bootstrap': 'node -r ./scripts/load-secrets.js scripts/bootstrap-staff.js --generate',
        'wallet:check': 'node -r ./scripts/load-secrets.js scripts/check-wallet-integrity.js',
        'telegram:webhook': 'node -r ./scripts/load-secrets.js scripts/telegram-set-webhook.js',
        'telegram:webhook-info': 'node -r ./scripts/load-secrets.js scripts/telegram-set-webhook.js --info',
      },
      dependencies: deps,
      // npm 11+ only runs dependency install scripts that are allowed here.
      allowScripts: rootPkg.allowScripts ?? {},
    },
    null,
    2,
  ) + '\n',
);
run('npm install --package-lock-only --ignore-scripts --no-audit --no-fund', out);

// 8. Archive.
const tarball = path.join(root, 'dist-cpanel.tar.gz');
fs.rmSync(tarball, { force: true });
run(`tar -czf "${path.basename(tarball)}" -C dist-cpanel .`);
const size = (fs.statSync(tarball).size / 1024 / 1024).toFixed(1);
console.log(`\nBundle ready: dist-cpanel/ and dist-cpanel.tar.gz (${size} MB)`);
