/**
 * BetBoos365 development startup: MySQL check -> NestJS (3200) -> Next.js (3000).
 * Children are started with the current node binary (no npm.cmd / shell), which
 * avoids the Windows `spawn EINVAL` that Node 20+ raises for .cmd files.
 */

const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const rootDir = path.join(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const BACKEND_PORT = 3200;
const FRONTEND_PORT = 3000;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}/api/v1`;
const isWindows = process.platform === 'win32';

const children = [];
let shuttingDown = false;

const log = (tag, msg) => console.log(`[${tag}] ${msg}`);
const fail = (tag, msg) => console.error(`[${tag}] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readDatabaseTarget() {
  const envPath = path.join(serverDir, '.env');
  if (!fs.existsSync(envPath)) throw new Error('server/.env not found');
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith('MYSQL_DATABASE_URL='));
  if (!line) throw new Error('MYSQL_DATABASE_URL is not set in server/.env');
  const url = new URL(line.slice('MYSQL_DATABASE_URL='.length).trim().replace(/^["']|["']$/g, ''));
  return { host: url.hostname, port: Number(url.port || 3306), database: url.pathname.slice(1) };
}

function canConnect(host, port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (err) => {
      socket.destroy();
      resolve(err);
    };
    socket.setTimeout(timeoutMs, () => done(new Error('connection timed out')));
    socket.once('connect', () => done(null));
    socket.once('error', done);
  });
}

function start(tag, script, args, cwd, env) {
  const child = spawn(process.execPath, [script, ...args], {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  child.tag = tag;
  children.push(child);
  child.on('error', (err) => {
    fail(tag, `Failed to start: ${err.message}`);
    shutdown(1);
  });
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    fail(tag, `Exited unexpectedly (code ${code}, signal ${signal}).`);
    shutdown(code || 1);
  });
  return child;
}

function killTree(child) {
  if (!child.pid || child.exitCode !== null) return;
  if (isWindows) {
    // `nest start --watch` and `next dev` run the app in grandchild processes.
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  log('Dev', 'Stopping services...');
  for (const child of children) killTree(child);
  log('Dev', 'Stopped.');
  process.exit(code);
}

async function waitFor(tag, url, child, isReady, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let last = 'no response yet';
  while (Date.now() < deadline) {
    if (shuttingDown || child.exitCode !== null) return false;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (await isReady(res)) return true;
      last = `HTTP ${res.status}`;
      if (res.status === 503) break;
    } catch (err) {
      last = err.cause?.code ?? err.message;
    }
    await sleep(1000);
  }
  if (!shuttingDown) fail(tag, `Not ready at ${url} (${last}).`);
  return false;
}

async function main() {
  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));
  process.on('SIGHUP', () => shutdown(0));

  let db;
  try {
    db = readDatabaseTarget();
  } catch (err) {
    fail('MySQL', err.message);
    process.exit(1);
  }
  const dbErr = await canConnect(db.host, db.port);
  if (dbErr) {
    fail('MySQL', `Cannot reach ${db.host}:${db.port} (${dbErr.code ?? dbErr.message}).`);
    fail('MySQL', 'Start Docker Desktop, then run: docker start tcl-staging-mysql');
    process.exit(1);
  }
  log('MySQL', `Reachable at ${db.host}:${db.port} (database "${db.database}").`);

  for (const [tag, port] of [['NestJS', BACKEND_PORT], ['Next.js', FRONTEND_PORT]]) {
    if (!(await canConnect('127.0.0.1', port, 1000))) {
      fail(tag, `Port ${port} is already in use. Stop the other dev process first.`);
      process.exit(1);
    }
  }

  log('NestJS', 'Starting...');
  const nest = start(
    'NestJS',
    path.join(serverDir, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js'),
    ['start', '--watch'],
    serverDir,
    { PORT: String(BACKEND_PORT) },
  );
  const healthy = await waitFor('NestJS', `${BACKEND_URL}/health`, nest, (res) => res.ok, 180000);
  if (!healthy) {
    if (!shuttingDown) fail('NestJS', 'Backend is not healthy (see the database error above). Not starting Next.js.');
    return shutdown(1);
  }
  log('NestJS', `Healthy on port ${BACKEND_PORT}, database connected.`);

  log('Next.js', 'Starting...');
  const next = start(
    'Next.js',
    path.join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next'),
    ['dev', '-p', String(FRONTEND_PORT)],
    rootDir,
    { BACKEND_API_URL: BACKEND_URL },
  );
  const ready = await waitFor('Next.js', `http://localhost:${FRONTEND_PORT}/login`, next, (res) => res.status < 500, 180000);
  if (!ready) return shutdown(1);
  log('Next.js', `Ready on port ${FRONTEND_PORT}.`);
  log('Dev', `Frontend http://localhost:${FRONTEND_PORT}  |  Backend ${BACKEND_URL}  |  Ctrl+C to stop.`);
}

main();
