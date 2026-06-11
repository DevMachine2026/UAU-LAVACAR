import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ResponseEnvelopeInterceptor } from '../common/interceptors/response-envelope.interceptor';
import {
  TestCleanup,
  createTestUser,
  createTestCustomer,
  createTestFranchiseUnit,
  createTestPlan,
  createTestSubscription,
  signJwt,
} from '../test/helpers';

describe('ANPR & Billing — IDOR e2e (Supertest)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cleanup: TestCleanup;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(() => {
    cleanup = new TestCleanup();
  });

  afterEach(async () => {
    await cleanup.flush(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Cenário 1 — OPERATOR acessa sua própria unidade ─────────────────────

  it('cenário 1: OPERATOR com defaultUnitId=unitA acessa GET /anpr/events/:unitA → 200', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);

    const operator = await createTestUser(prisma, cleanup, 'OPERATOR', {
      defaultUnitId: unit.id,
    });

    const token = signJwt(app, operator);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/anpr/events/${unit.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  // ─── Cenário 2 — OPERATOR tenta acessar outra unidade → 403 ─────────────

  it('cenário 2: OPERATOR tenta GET /anpr/events/:unitB (não é sua unidade) → 403', async () => {
    const { unit: unitA } = await createTestFranchiseUnit(prisma, cleanup);
    const { unit: unitB } = await createTestFranchiseUnit(prisma, cleanup);

    const operator = await createTestUser(prisma, cleanup, 'OPERATOR', {
      defaultUnitId: unitA.id,
    });

    const token = signJwt(app, operator);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/anpr/events/${unitB.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  // ─── Cenário 3 — SUPER_ADMIN acessa qualquer unidade ─────────────────────

  it('cenário 3: SUPER_ADMIN acessa GET /anpr/events/:qualquerUnidade → 200', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);

    const admin = await createTestUser(prisma, cleanup, 'SUPER_ADMIN');
    const token = signJwt(app, admin);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/anpr/events/${unit.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  // ─── Cenário 5 — Webhook sem secret → 401 ────────────────────────────────

  it('cenário 5: POST /anpr/webhook sem header x-anpr-secret → 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/anpr/webhook')
      .send({ cameraId: 'cam-test', plate: 'TST0001' });

    expect(res.status).toBe(401);
  });

  // ─── Cenário 6 — Webhook com secret errado → 401 ─────────────────────────

  it('cenário 6: POST /anpr/webhook com secret errado → 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/anpr/webhook')
      .set('x-anpr-secret', 'wrong-secret')
      .send({ cameraId: 'cam-test', plate: 'TST0002' });

    expect(res.status).toBe(401);
  });

  // ─── Cenário 7 — Webhook com secret correto → passa autenticação ─────────

  it('cenário 7: POST /anpr/webhook com secret correto passa autenticação (linha 26 executada)', async () => {
    // O processEvent pode retornar qualquer coisa (404, 201, etc.)
    // O que importa é que NÃO seja 401 — a linha 26 foi atingida.
    const res = await request(app.getHttpServer())
      .post('/api/v1/anpr/webhook')
      .set('x-anpr-secret', process.env.ANPR_WEBHOOK_SECRET ?? 'test-anpr-secret')
      .send({ cameraId: 'cam-test', plate: 'TST0003' });

    expect(res.status).not.toBe(401);
  });

  // ─── Cenário 8 — GET /anpr/events sem JWT → 401 ──────────────────────────

  it('cenário 8: GET /anpr/events sem token JWT → 401', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/anpr/events/${unit.id}`);

    expect(res.status).toBe(401);
  });

  // ─── Cenário 9 — CUSTOMER não tem acesso a /anpr/events → 403 ────────────

  it('cenário 9: CUSTOMER tenta GET /anpr/events → 403', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);
    const { user } = await createTestCustomer(prisma, cleanup);
    const token = signJwt(app, user);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/anpr/events/${unit.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  // ─── Cenário 10 — FRANCHISE_OWNER acessa unidade que não é a sua → 403 ───

  it('cenário 10: FRANCHISE_OWNER tenta GET /anpr/events de outra unidade → 403', async () => {
    const { unit: unitA } = await createTestFranchiseUnit(prisma, cleanup);
    const { unit: unitB } = await createTestFranchiseUnit(prisma, cleanup);

    const owner = await createTestUser(prisma, cleanup, 'FRANCHISE_OWNER', {
      defaultUnitId: unitA.id,
    });
    const token = signJwt(app, owner);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/anpr/events/${unitB.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  // ─── Cenário 4 — FRANCHISE_OWNER isolamento em /billing ──────────────────

  it('cenário 4: FRANCHISE_OWNER só vê billings de clientes que visitaram sua unidade', async () => {
    const { unit: unitA } = await createTestFranchiseUnit(prisma, cleanup);
    const { unit: unitB } = await createTestFranchiseUnit(prisma, cleanup);

    const ownerA = await createTestUser(prisma, cleanup, 'FRANCHISE_OWNER', {
      defaultUnitId: unitA.id,
    });
    const ownerB = await createTestUser(prisma, cleanup, 'FRANCHISE_OWNER', {
      defaultUnitId: unitB.id,
    });

    const plan = await createTestPlan(prisma, cleanup);
    const { customer: customerA } = await createTestCustomer(prisma, cleanup);
    const { customer: customerB } = await createTestCustomer(prisma, cleanup);

    const { billing: billingA } = await createTestSubscription(
      prisma, cleanup, customerA.id, plan.id,
    );
    const { billing: billingB } = await createTestSubscription(
      prisma, cleanup, customerB.id, plan.id,
    );

    // Shift + Attendance para customerA na unitA
    const operatorA = await createTestUser(prisma, cleanup, 'OPERATOR', {
      defaultUnitId: unitA.id,
    });
    const shiftA = await prisma.shift.create({
      data: { unitId: unitA.id, operatorId: operatorA.id, status: 'OPEN' },
    });
    cleanup.track('shifts', shiftA.id);

    await prisma.attendance.create({
      data: {
        shiftId: shiftA.id,
        customerId: customerA.id,
        plate: 'TSTA001',
        status: 'COMPLETED',
      },
    });

    // Shift + Attendance para customerB na unitB
    const operatorB = await createTestUser(prisma, cleanup, 'OPERATOR', {
      defaultUnitId: unitB.id,
    });
    const shiftB = await prisma.shift.create({
      data: { unitId: unitB.id, operatorId: operatorB.id, status: 'OPEN' },
    });
    cleanup.track('shifts', shiftB.id);

    await prisma.attendance.create({
      data: {
        shiftId: shiftB.id,
        customerId: customerB.id,
        plate: 'TSTB001',
        status: 'COMPLETED',
      },
    });

    const tokenA = signJwt(app, ownerA);
    const tokenB = signJwt(app, ownerB);

    // ownerA só vê billings de customerA
    const resA = await request(app.getHttpServer())
      .get('/api/v1/billing')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(resA.status).toBe(200);
    const billingIdsA: string[] = resA.body.data?.data?.map((b: any) => b.id) ?? [];
    expect(billingIdsA).toContain(billingA.id);
    expect(billingIdsA).not.toContain(billingB.id);

    // ownerB só vê billings de customerB
    const resB = await request(app.getHttpServer())
      .get('/api/v1/billing')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resB.status).toBe(200);
    const billingIdsB: string[] = resB.body.data?.data?.map((b: any) => b.id) ?? [];
    expect(billingIdsB).toContain(billingB.id);
    expect(billingIdsB).not.toContain(billingA.id);
  }, 60000);
});
