import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAdminSettingDto } from './dto/update-admin-setting.dto';

@Injectable()
export class AdminSettingsService {
  private readonly cache = new Map<string, { value: string; expiresAt: number }>();
  private readonly TTL_MS = 60_000;

  constructor(private prisma: PrismaService) {}

  async getCached(key: string): Promise<string> {
    const now = Date.now();
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > now) return hit.value;

    const setting = await this.findOne(key);
    this.cache.set(key, { value: setting.value, expiresAt: now + this.TTL_MS });
    return setting.value;
  }

  async findAll() {
    return this.prisma.adminSetting.findMany();
  }

  async findOne(key: string) {
    const setting = await this.prisma.adminSetting.findUnique({
      where: { key },
    });
    if (!setting) {
      throw new NotFoundException(`Configuração com chave ${key} não encontrada`);
    }
    return setting;
  }

  async update(key: string, updateDto: UpdateAdminSettingDto) {
    return this.prisma.adminSetting.upsert({
      where: { key },
      update: { value: updateDto.value },
      create: { key, value: updateDto.value },
    });
  }

  async upsertBulk(settings: Record<string, string>) {
    const entries = Object.entries(settings);
    const results = await Promise.all(
      entries.map(([key, value]) =>
        this.prisma.adminSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );
    return results;
  }
}
