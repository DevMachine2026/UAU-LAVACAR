import { UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Mailer } from '../third-party/Mailer';
import { PrismaService } from '../prisma/prisma.service';
import { TestCleanup, TEST_PASSWORD, createTestUser, flushTestCleanup } from '../test/helpers';

describe('AuthService.login — gate de betaAccess', () => {
  let module: TestingModule;
  let service: AuthService;
  let prisma: PrismaService;
  let cleanup: TestCleanup;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '8h' },
        }),
      ],
      providers: [
        AuthService,
        PrismaService,
        { provide: Mailer, useValue: { sendMessage: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
    prisma = module.get(PrismaService);
    await prisma.$connect();
  });

  beforeEach(() => {
    cleanup = new TestCleanup();
  });

  afterEach(async () => {
    await flushTestCleanup(cleanup, prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  it('permite login de um CUSTOMER com betaAccess: false', async () => {
    const user = await createTestUser(prisma, cleanup, 'CUSTOMER', { betaAccess: false });

    const result = await service.login({ email: user.email, password: TEST_PASSWORD });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.user.id).toBe(user.id);
  });

  it('continua bloqueando login de usuário com status diferente de ACTIVE', async () => {
    const user = await createTestUser(prisma, cleanup, 'CUSTOMER', {
      betaAccess: false,
      status: 'INACTIVE',
    });

    await expect(
      service.login({ email: user.email, password: TEST_PASSWORD }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
