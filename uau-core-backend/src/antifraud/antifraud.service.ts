import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';
import { UserStatus } from '@prisma/client';

@Injectable()
export class AntifraudService {
  constructor(private prisma: PrismaService) {}

  async createFlag(dto: CreateFlagDto) {
    const flag = await this.prisma.antiFraudFlag.create({ data: dto });
    if (dto.severity === 'CRITICAL') {
      await this.prisma.user.update({ where: { id: dto.userId }, data: { status: UserStatus.SUSPECT } });
    }
    return flag;
  }

  async findAllFlags(filters?: { status?: string; severity?: string; type?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.type) where.type = filters.type;

    return this.prisma.antiFraudFlag.findMany({
      where,
      include: { user: { select: { name: true, email: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFlag(id: string) {
    const flag = await this.prisma.antiFraudFlag.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true, status: true } } },
    });
    if (!flag) throw new NotFoundException('Flag não encontrada');
    return flag;
  }

  async reviewFlag(id: string, payload: { status: string; reason?: string }) {
    const flag = await this.prisma.antiFraudFlag.findUnique({ where: { id } });
    if (!flag) throw new NotFoundException('Flag não encontrada');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.antiFraudFlag.update({
        where: { id },
        data: {
          status: payload.status as never,
          reason: payload.reason,
          reviewedAt: new Date(),
        },
      });

      if (payload.status === 'BLOCKED') {
        await tx.user.update({ where: { id: flag.userId }, data: { status: UserStatus.BLOCKED } });
      } else if (payload.status === 'DISMISSED') {
        await tx.user.update({ where: { id: flag.userId }, data: { status: UserStatus.ACTIVE } });
      }

      return updated;
    });
  }

  async resolveFlag(id: string, dto: UpdateFlagDto) {
    return this.reviewFlag(id, { status: dto.status as string, reason: dto.reviewedBy });
  }

  async markUserSuspect(userId: string, reason: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { status: UserStatus.SUSPECT } });
    await this.logSecurityEvent(userId, 'USER_MARKED_SUSPECT', undefined, undefined, { reason });
    return { ok: true };
  }

  async blockUser(userId: string, reason: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { status: UserStatus.BLOCKED } });
    await this.logSecurityEvent(userId, 'USER_BLOCKED', undefined, undefined, { reason });
    return { ok: true };
  }

  async unblockUser(userId: string, reason: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { status: UserStatus.ACTIVE } });
    await this.logSecurityEvent(userId, 'USER_UNBLOCKED', undefined, undefined, { reason });
    return { ok: true };
  }

  async getSecurityLogs(filters?: { eventType?: string; userId?: string; startDate?: string; endDate?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.eventType) where.event = filters.eventType;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {
        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
        ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
      };
    }

    return this.prisma.securityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async logSecurityEvent(userId: string, event: string, ip?: string, userAgent?: string, metadata?: unknown) {
    return this.prisma.securityLog.create({
      data: { userId, event, ip, userAgent, metadata: (metadata as object) ?? {} },
    });
  }
}
