import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CameraEventDto } from './dto/camera-event.dto';

@Injectable()
export class AnprService {
  private readonly logger = new Logger(AnprService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processEvent(eventDto: CameraEventDto) {
    const { cameraId, plate } = eventDto;
    this.logger.log(`Recebida leitura de placa: ${plate} da câmera: ${cameraId}`);

    const camera = await this.prisma.anprCamera.findUnique({
      where: { id: cameraId },
    });

    if (!camera) {
      await this.prisma.securityLog.create({
        data: {
          event: 'ANPR_UNAUTHORIZED_CAMERA',
          metadata: { cameraId, plate },
        },
      });
      this.logger.warn(`Câmera não autorizada ou inexistente: ${cameraId}`);
      throw new NotFoundException(`Câmera não encontrada: ${cameraId}`);
    }

    if (!camera.isActive) {
      await this.prisma.securityLog.create({
        data: {
          event: 'ANPR_INACTIVE_CAMERA',
          metadata: { cameraId, plate, unitId: camera.unitId },
        },
      });
      this.logger.warn(`Câmera inativa tentou enviar evento: ${cameraId}`);
      throw new NotFoundException(`Câmera inativa: ${cameraId}`);
    }

    const event = await this.prisma.anprEvent.create({
      data: {
        cameraId,
        plate,
        confidence: eventDto.confidence ? parseFloat(eventDto.confidence) : null,
        unitId: camera.unitId,
      },
    });

    // 2. Tentar encontrar o veículo pela placa
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { plate },
      include: { customer: true },
    });

    if (vehicle) {
      this.logger.log(`Veículo reconhecido! ID: ${vehicle.id}, Cliente: ${vehicle.customerId}`);
      // Futuro: Se tiver assinatura ativa, pode criar um DailyWash automático ou colocar numa Fila Virtual.
    } else {
      this.logger.log(`Placa ${plate} não encontrada na base de clientes.`);
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
