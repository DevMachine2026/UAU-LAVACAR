import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CameraEventDto } from './dto/camera-event.dto';

@Injectable()
export class AnprService {
  private readonly logger = new Logger(AnprService.name);

  constructor(private prisma: PrismaService) {}

  async processEvent(eventDto: CameraEventDto) {
    this.logger.log(`Recebida leitura de placa: ${eventDto.plate} da câmera: ${eventDto.cameraId}`);

    // 1. Identificar de qual unidade é essa câmera (Simulação: precisamos ter um cadastro de câmeras)
    // Como simplificação, vamos assumir que recebemos o franchiseUnitId na request ou buscamos no banco.
    // Para efeito de demonstração, logamos o evento no banco.

    const event = await this.prisma.anprEvent.create({
      data: {
        cameraId: eventDto.cameraId,
        plate: eventDto.plate,
        confidence: eventDto.confidence ? parseFloat(eventDto.confidence) : null,
        unitId: 'TODO_MAP_CAMERA_TO_UNIT', // Ideal: buscar a unidade correspondente
      },
    });

    // 2. Tentar encontrar o veículo pela placa
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { plate: eventDto.plate },
      include: { customer: true },
    });

    if (vehicle) {
      this.logger.log(`Veículo reconhecido! ID: ${vehicle.id}, Cliente: ${vehicle.customerId}`);
      // Futuro: Se tiver assinatura ativa, pode criar um DailyWash automático ou colocar numa Fila Virtual.
    } else {
      this.logger.log(`Placa ${eventDto.plate} não encontrada na base de clientes.`);
      // Futuro: Registrar como avulso na Fila Virtual
    }

    return { success: true, eventId: event.id, recognized: !!vehicle };
  }

  async getRecentEvents(franchiseUnitId: string) {
    return this.prisma.anprEvent.findMany({
      where: { unitId: franchiseUnitId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
