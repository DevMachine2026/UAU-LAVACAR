import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    return campaign;
  }

  async update(id: string, updateDto: UpdateCampaignDto) {
    return this.prisma.campaign.update({
      where: { id },
      data: updateDto,
    }).catch(() => {
      throw new NotFoundException('Campanha não encontrada');
    });
  }

  async trackView(id: string, userId: string) {
    await this.findOne(id);
    return { success: true, event: 'view', campaignId: id, userId };
  }

  async trackClick(id: string, userId: string) {
    await this.findOne(id);
    return { success: true, event: 'click', campaignId: id, userId };
  }

  async trackDismiss(id: string, userId: string) {
    await this.findOne(id);
    return { success: true, event: 'dismiss', campaignId: id, userId };
  }
}
