import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Mailer } from '../third-party/Mailer';
import * as bcrypt from 'bcrypt';
import { SubscriptionStatus } from '@prisma/client';

// Assinaturas nesses status ainda cobram ou podem voltar a cobrar no Asaas;
// exigir cancelamento com o suporte antes de excluir evita apagar uma conta
// com cobrança recorrente em aberto.
const BLOCKING_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['ACTIVE', 'OVERDUE', 'SUSPENDED'];

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailer: Mailer,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Conta bloqueada ou inativa');
    }

    const jti = randomUUID();
    const payload = { sub: user.id, email: user.email, role: user.role, jti };
    const accessToken = this.jwtService.sign(payload);

    const { passwordHash, ...userWithoutPassword } = user;

    return { accessToken, user: userWithoutPassword };
  }

  async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Sempre retorna sucesso para não revelar se o e-mail existe
    if (!user) return { resetToken: '' };

    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);

    const jti = randomUUID();
    const resetToken = this.jwtService.sign(
      { sub: user.id, codeHash, purpose: 'password-reset', jti },
      { expiresIn: '15m' },
    );

    await this.mailer.sendMessage({
      to: email,
      subject: 'Código de recuperação de senha — UAU+',
      template: 'forgotPassword',
      context: { token: code, recipientName: user.name },
    });

    return { resetToken };
  }

  async logout(jti: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    await this.prisma.revokedToken.create({ data: { jti, expiresAt } });
    if (Math.random() < 0.01) {
      await this.prisma.revokedToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Senha atual incorreta');

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('A nova senha deve ser diferente da atual');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async resetPassword(resetToken: string, code: string, newPassword: string): Promise<void> {
    let payload: { sub: string; codeHash: string; purpose: string; jti: string; exp: number };

    try {
      payload = this.jwtService.verify(resetToken);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    if (payload.purpose !== 'password-reset') {
      throw new UnauthorizedException('Token inválido');
    }

    if (payload.jti) {
      const revoked = await this.prisma.revokedToken.findUnique({ where: { jti: payload.jti } });
      if (revoked) throw new UnauthorizedException('Token já utilizado');
    }

    const isCodeValid = await bcrypt.compare(code, payload.codeHash);
    if (!isCodeValid) {
      throw new UnauthorizedException('Código inválido');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash: newHash },
    });

    if (payload.jti) {
      const expiresAt = new Date(payload.exp * 1000);
      await this.prisma.revokedToken.create({ data: { jti: payload.jti, expiresAt } });
    }
  }

  async deleteAccount(userId: string, jti?: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customer: { include: { subscriptions: true } } },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const hasBlockingSubscription = user.customer?.subscriptions.some((s) =>
      BLOCKING_SUBSCRIPTION_STATUSES.includes(s.status),
    );
    if (hasBlockingSubscription) {
      throw new BadRequestException(
        'Você tem uma assinatura ativa. Cancele sua assinatura falando com o suporte antes de excluir sua conta.',
      );
    }

    const randomPasswordHash = await bcrypt.hash(randomUUID(), 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: 'Usuário removido',
        email: `deleted-${user.id}@removed.uauplus.mobile`,
        passwordHash: randomPasswordHash,
        status: 'INACTIVE',
      },
    });

    if (user.customer) {
      await this.prisma.customer.update({
        where: { id: user.customer.id },
        data: { phone: null, cpf: null },
      });
    }

    if (jti) await this.logout(jti);

    return { message: 'Conta excluída com sucesso' };
  }
}
