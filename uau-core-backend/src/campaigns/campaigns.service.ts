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

  async activate(id: string) {
    return this.prisma.campaign.update({
      where: { id },
      data: { isActive: true },
      select: { id: true, isActive: true },
    }).catch(() => { throw new NotFoundException('Campanha não encontrada'); });
  }

  async deactivate(id: string) {
    return this.prisma.campaign.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    }).catch(() => { throw new NotFoundException('Campanha não encontrada'); });
  }

  async getMetrics(id: string) {
    const campaign = await this.findOne(id);
    // Tracking de views/cliques/conversões ainda não é persistido — contadores zerados por ora
    return {
      campaignId: campaign.id,
      name: campaign.name,
      isActive: campaign.isActive,
      startAt: campaign.startAt,
      endAt: campaign.endAt,
      views: 0,
      clicks: 0,
      dismissals: 0,
      conversions: 0,
      customersReached: 0,
    };
  }

  async findActive() {
    const now = new Date();
    return this.prisma.campaign.findMany({
      where: {
        isActive: true,
        OR: [
          { startAt: null },
          { startAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endAt: null },
              { endAt: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
