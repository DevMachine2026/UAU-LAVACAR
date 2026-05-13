import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAdminSettingDto } from './dto/update-admin-setting.dto';

@Injectable()
export class AdminSettingsService {
  constructor(private prisma: PrismaService) {}

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
}
