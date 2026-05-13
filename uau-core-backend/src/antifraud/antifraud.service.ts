import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';
import { UserStatus } from '@prisma/client';

@Injectable()
export class AntifraudService {
  constructor(private prisma: PrismaService) {}

  async createFlag(createDto: CreateFlagDto) {
    const flag = await this.prisma.antiFraudFlag.create({
      data: createDto,
    });

    // Se for CRITICAL, já bloqueia ou marca o usuário como SUSPECT automaticamente
    if (createDto.severity === 'CRITICAL') {
      await this.prisma.user.update({
        where: { id: createDto.userId },
        data: { status: UserStatus.SUSPECT },
      });
    }

    return flag;
  }

  async findAllFlags() {
    return this.prisma.antiFraudFlag.findMany({
      include: {
        user: { select: { name: true, email: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveFlag(id: string, updateDto: UpdateFlagDto) {
    const flag = await this.prisma.antiFraudFlag.findUnique({ where: { id } });
    if (!flag) throw new NotFoundException('Flag não encontrada');

    return this.prisma.$transaction(async (tx) => {
      const updatedFlag = await tx.antiFraudFlag.update({
        where: { id },
        data: {
          status: updateDto.status,
          reviewedBy: updateDto.reviewedBy,
          reviewedAt: new Date(),
        },
      });

      // Se o status for BLOCKED, reflete no usuário
      if (updateDto.status === 'BLOCKED') {
        await tx.user.update({
          where: { id: flag.userId },
          data: { status: UserStatus.BLOCKED },
        });
      } else if (updateDto.status === 'DISMISSED') {
        // Volta pra ativo se foi falso positivo
        await tx.user.update({
          where: { id: flag.userId },
          data: { status: UserStatus.ACTIVE },
        });
      }

      return updatedFlag;
    });
  }

  async logSecurityEvent(userId: string, event: string, ip?: string, userAgent?: string, metadata?: any) {
    return this.prisma.securityLog.create({
      data: {
        userId,
        event,
        ip,
        userAgent,
        metadata: metadata || {},
      },
    });
  }
}
