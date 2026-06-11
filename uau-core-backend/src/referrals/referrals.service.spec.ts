import { Test, TestingModule } from '@nestjs/testing';
import { ReferralsService } from './referrals.service';
import { PrismaService } from '../prisma/prisma.service';
import { TestCleanup, createTestCustomer, createTestUser } from '../test/helpers';

describe('ReferralsService — rede MMN', () => {
  let module: TestingModule;
  let service: ReferralsService;
  let prisma: PrismaService;
  let cleanup: TestCleanup;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [ReferralsService, PrismaService],
    }).compile();

    service = module.get(ReferralsService);
    prisma = module.get(PrismaService);
    await prisma.$connect();
  });

  beforeEach(() => {
    cleanup = new TestCleanup();
  });

  afterEach(async () => {
    await cleanup.flush(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  async function createChain(length: number) {
    const users = [];
    for (let i = 0; i < length; i++) {
      // createTestCustomer cria User + Customer + Wallet (necessário para getMyNetwork)
      const { user } = await createTestCustomer(prisma, cleanup);
      users.push(user);
    }
    // Cria referrals: users[0] → users[1] → users[2] → ...
    for (let i = 1; i < users.length; i++) {
      await prisma.referral.create({
        data: { referrerId: users[i - 1].id, referredId: users[i].id },
      });
      // Referrals são deletados no flush via referrerId (tracked nos userIds)
    }
    return users;
  }

  // ─── Cenário 1 — getMyNetwork retorna 3 linhas corretamente ──────────────

  it('cenário 1: getMyNetwork de userA retorna B em line1, C em line2, D em line3', async () => {
    // Árvore: A → B → C → D
    const [userA, userB, userC, userD] = await createChain(4);

    const network = await service.getMyNetwork(userA.id);

    const line1Ids = network.line1.map((u: any) => u.id);
    const line2Ids = network.line2.map((u: any) => u.id);
    const line3Ids = network.line3.map((u: any) => u.id);

    expect(line1Ids).toContain(userB.id);
    expect(line2Ids).toContain(userC.id);
    expect(line3Ids).toContain(userD.id);

    // userD não aparece em linhas erradas
    expect(line1Ids).not.toContain(userD.id);
    expect(line2Ids).not.toContain(userD.id);
  });

  // ─── Cenário 2 — getMyTree respeita MAX_TREE_DEPTH = 10 ──────────────────

  it('cenário 2: cadeia de 12 usuários — getMyTree retorna no máximo profundidade 10', async () => {
    // getMyTree requer apenas User (não Customer) — usa createTestUser para ser mais rápido
    const users: Awaited<ReturnType<typeof createTestUser>>[] = [];
    for (let i = 0; i < 12; i++) {
      users.push(await createTestUser(prisma, cleanup, 'CUSTOMER'));
    }
    for (let i = 1; i < users.length; i++) {
      await prisma.referral.create({
        data: { referrerId: users[i - 1].id, referredId: users[i].id },
      });
    }

    const tree = await service.getMyTree(users[0].id) as any;

    // Função recursiva para encontrar profundidade máxima na árvore retornada
    function maxDepth(node: any, depth = 0): number {
      if (!node.children || node.children.length === 0) return depth;
      return Math.max(...node.children.map((c: any) => maxDepth(c, depth + 1)));
    }

    const depth = maxDepth(tree);
    expect(depth).toBeLessThanOrEqual(10);

    expect(tree.id).toBe(users[0].id);
  }, 60000);

  // ─── Cenário 4 — createReferral: registro válido ─────────────────────────

  it('cenário 4: createReferral cria referral no banco entre dois usuários', async () => {
    const { user: referrer } = await createTestCustomer(prisma, cleanup);
    const { user: referred } = await createTestCustomer(prisma, cleanup);

    const result = await service.createReferral({
      referrerId: referrer.id,
      referredId: referred.id,
    });

    expect(result.referrerId).toBe(referrer.id);
    expect(result.referredId).toBe(referred.id);

    const found = await prisma.referral.findUnique({ where: { referredId: referred.id } });
    expect(found).not.toBeNull();
  });

  // ─── Cenário 5 — createReferral: referral duplicado → ConflictException ──

  it('cenário 5: createReferral duplicado (mesmo referredId) lança ConflictException', async () => {
    const { user: referrerA } = await createTestCustomer(prisma, cleanup);
    const { user: referrerB } = await createTestCustomer(prisma, cleanup);
    const { user: referred } = await createTestCustomer(prisma, cleanup);

    // Primeiro referral — OK
    await service.createReferral({ referrerId: referrerA.id, referredId: referred.id });

    // Segundo com mesmo referredId — deve lançar
    await expect(
      service.createReferral({ referrerId: referrerB.id, referredId: referred.id }),
    ).rejects.toThrow('Este usuário já foi indicado por outra pessoa');
  });

  // ─── Cenário 6 — getReferralSummary: usuário inexistente → NotFoundException

  it('cenário 6: getReferralSummary com userId inválido lança NotFoundException', async () => {
    await expect(
      service.getReferralSummary('non-existent-user-id'),
    ).rejects.toThrow('Usuário não encontrado');
  });

  // ─── Cenário 7 — getReferralSummary: usuário sem referrals → totais zerados

  it('cenário 7: getReferralSummary de usuário sem indicações retorna totais zerados', async () => {
    const user = await createTestUser(prisma, cleanup, 'CUSTOMER');

    const summary = await service.getReferralSummary(user.id);

    expect(summary.totalIndications).toBe(0);
    expect(summary.indicatedBy).toBeNull();
    expect(summary.referrals).toHaveLength(0);
  });

  // ─── Cenário 8 — getReferralSummary: usuário com indicações ──────────────

  it('cenário 8: getReferralSummary retorna contagem correta de indicados e indicador', async () => {
    const referrer = await createTestUser(prisma, cleanup, 'CUSTOMER');
    const referred1 = await createTestUser(prisma, cleanup, 'CUSTOMER');
    const referred2 = await createTestUser(prisma, cleanup, 'CUSTOMER');

    await prisma.referral.create({ data: { referrerId: referrer.id, referredId: referred1.id } });
    await prisma.referral.create({ data: { referrerId: referrer.id, referredId: referred2.id } });

    const summaryReferrer = await service.getReferralSummary(referrer.id);
    expect(summaryReferrer.totalIndications).toBe(2);
    expect(summaryReferrer.indicatedBy).toBeNull();
    expect(summaryReferrer.referrals.map((r: any) => r.id)).toContain(referred1.id);
    expect(summaryReferrer.referrals.map((r: any) => r.id)).toContain(referred2.id);

    // referred1 foi indicado por referrer
    const summaryReferred = await service.getReferralSummary(referred1.id);
    expect(summaryReferred.totalIndications).toBe(0);
    expect(summaryReferred.indicatedBy?.id).toBe(referrer.id);
  });

  // ─── Cenário 3 — TODO cashback de referral ───────────────────────────────

  it('TODO: cashback de referral por linha — lógica não implementada ainda', () => {
    // O sistema atual registra apenas a rede (3 linhas).
    // Não há cálculo de comissão automático por linha de referral.
    // Quando implementado, testar:
    //   - Comissão linha 1: X%
    //   - Comissão linha 2: Y%
    //   - Comissão linha 3: Z%
    //   - Crédito na carteira do referenciador ao ativar assinatura do indicado
    expect(true).toBe(true); // placeholder
  });
});
