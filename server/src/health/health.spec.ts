import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { HealthModule } from './health.module';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('HealthController / Version Endpoint & Health Check Review (Phase 1)', () => {
  let app: INestApplication;
  const testSecret = 'test-deploy-secret-12345';
  let testWorkDir: string;
  let testBuildIdPath: string;
  let originalCpanelSecret: string | undefined;
  let originalCwd: string;

  beforeAll(() => {
    originalCpanelSecret = process.env.CPANEL_DEPLOY_SECRET;
    originalCwd = process.cwd();

    // Use os.mkdtempSync for completely safe and isolated test directory handling
    testWorkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'betboos365-health-test-'));
    testBuildIdPath = path.resolve(testWorkDir, '.next', 'BUILD_ID');
  });

  afterAll(() => {
    if (originalCpanelSecret !== undefined) {
      process.env.CPANEL_DEPLOY_SECRET = originalCpanelSecret;
    } else {
      delete process.env.CPANEL_DEPLOY_SECRET;
    }

    try {
      process.chdir(originalCwd);
      if (testWorkDir && fs.existsSync(testWorkDir)) {
        fs.rmSync(testWorkDir, { recursive: true, force: true });
      }
    } catch {}
  });

  async function initAppWithMockBuildId(buildIdContent: string | null) {
    process.chdir(testWorkDir);

    if (!fs.existsSync(path.dirname(testBuildIdPath))) {
      fs.mkdirSync(path.dirname(testBuildIdPath), { recursive: true });
    }

    if (buildIdContent !== null) {
      fs.writeFileSync(testBuildIdPath, buildIdContent, 'utf8');
    } else {
      if (fs.existsSync(testBuildIdPath)) {
        fs.unlinkSync(testBuildIdPath);
      }
    }

    process.env.CPANEL_DEPLOY_SECRET = testSecret;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: async () => [{ '1': 1 }],
      })
      .compile();

    const testApp = moduleFixture.createNestApplication();
    await testApp.init();
    return testApp;
  }

  afterEach(() => {
    try {
      process.chdir(originalCwd);
    } catch {}
  });

  it('1. Existing GET /health returns status ok when database is up', async () => {
    let testApp: INestApplication | undefined;
    try {
      testApp = await initAppWithMockBuildId('test-build-id-abc987');
      const res = await request(testApp.getHttpServer()).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('up');
    } finally {
      if (testApp) await testApp.close();
    }
  });

  it('2. Existing GET /health retains original ServiceUnavailableException (503) behavior on DB failure', async () => {
    let testApp: INestApplication | undefined;
    try {
      testApp = await initAppWithMockBuildId('test-build-id-abc987');
      const prisma = testApp.get(PrismaService);
      jest.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('Connection lost'));

      const res = await request(testApp.getHttpServer()).get('/health');
      expect(res.status).toBe(503);
      expect(res.body.message).toBe('Database connection failed');
    } finally {
      if (testApp) await testApp.close();
    }
  });

  it('3. GET /health/version with correct secret returns 200 and buildId', async () => {
    let testApp: INestApplication | undefined;
    try {
      testApp = await initAppWithMockBuildId('test-build-id-abc987');
      const res = await request(testApp.getHttpServer())
        .get('/health/version')
        .set('x-deployment-secret', testSecret);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.buildId).toBe('test-build-id-abc987');
    } finally {
      if (testApp) await testApp.close();
    }
  });

  it('4. GET /health/version with missing secret returns 401 Unauthorized', async () => {
    let testApp: INestApplication | undefined;
    try {
      testApp = await initAppWithMockBuildId('test-build-id-abc987');
      const res = await request(testApp.getHttpServer()).get('/health/version');
      expect(res.status).toBe(401);
    } finally {
      if (testApp) await testApp.close();
    }
  });

  it('5. GET /health/version with incorrect secret returns 401 Unauthorized', async () => {
    let testApp: INestApplication | undefined;
    try {
      testApp = await initAppWithMockBuildId('test-build-id-abc987');
      const res = await request(testApp.getHttpServer())
        .get('/health/version')
        .set('x-deployment-secret', 'wrong-secret');
      expect(res.status).toBe(401);
    } finally {
      if (testApp) await testApp.close();
    }
  });

  it('6. Missing server-side CPANEL_DEPLOY_SECRET fails closed with 500', async () => {
    let testApp: INestApplication | undefined;
    const prevSecret = process.env.CPANEL_DEPLOY_SECRET;
    try {
      testApp = await initAppWithMockBuildId('test-build-id-abc987');
      delete process.env.CPANEL_DEPLOY_SECRET;

      const res = await request(testApp.getHttpServer())
        .get('/health/version')
        .set('x-deployment-secret', testSecret);
      expect(res.status).toBe(500);
    } finally {
      if (prevSecret !== undefined) {
        process.env.CPANEL_DEPLOY_SECRET = prevSecret;
      } else {
        delete process.env.CPANEL_DEPLOY_SECRET;
      }
      if (testApp) await testApp.close();
    }
  });

  it('7. Missing or unreadable BUILD_ID fails safely with 500', async () => {
    let testApp: INestApplication | undefined;
    try {
      testApp = await initAppWithMockBuildId(null);

      const res = await request(testApp.getHttpServer())
        .get('/health/version')
        .set('x-deployment-secret', testSecret);
      expect(res.status).toBe(500);
    } finally {
      if (testApp) await testApp.close();
    }
  });

  it('8. Changing BUILD_ID file after process initialization does not change cached response (immutable state)', async () => {
    let testApp: INestApplication | undefined;
    try {
      testApp = await initAppWithMockBuildId('test-build-id-abc987');

      // Overwrite BUILD_ID file on disk after app init in isolated directory
      fs.writeFileSync(testBuildIdPath, 'tampered-build-id-xyz', 'utf8');

      const res = await request(testApp.getHttpServer())
        .get('/health/version')
        .set('x-deployment-secret', testSecret);
      expect(res.status).toBe(200);
      expect(res.body.buildId).toBe('test-build-id-abc987');
    } finally {
      if (testApp) await testApp.close();
    }
  });
});
