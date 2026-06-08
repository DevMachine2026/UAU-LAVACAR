import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { Mailer } from '../third-party/Mailer';
import * as bcrypt from 'bcrypt';

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

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const { passwordHash, ...userWithoutPassword } = user;

    return { accessToken, user: userWithoutPassword };
  }

  async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Sempre retorna sucesso para não revelar se o e-mail existe
    if (!user) return { resetToken: '' };

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);

    const resetToken = this.jwtService.sign(
      { sub: user.id, codeHash, purpose: 'password-reset' },
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

  async resetPassword(resetToken: string, code: string, newPassword: string): Promise<void> {
    let payload: { sub: string; codeHash: string; purpose: string };

    try {
      payload = this.jwtService.verify(resetToken);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    if (payload.purpose !== 'password-reset') {
      throw new UnauthorizedException('Token inválido');
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
  }
}
