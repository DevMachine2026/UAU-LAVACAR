import { Controller, Post, Body, Get, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { AnprService } from './anpr.service';
import { CameraEventDto } from './dto/camera-event.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('anpr')
@Controller('anpr')
export class AnprController {
  constructor(private readonly anprService: AnprService) {}

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Recebe eventos das câmeras LPR/ANPR' })
  async handleWebhook(
    @Headers('x-anpr-secret') headerSecret: string,
    @Body() eventDto: CameraEventDto,
  ) {
    const expectedSecret = process.env.ANPR_WEBHOOK_SECRET;
    if (!expectedSecret || headerSecret !== expectedSecret) {
      throw new UnauthorizedException('Webhook secret inválido');
    }
    return this.anprService.processEvent(eventDto);
  }

  @ApiBearerAuth()
  @Get('events/:franchiseUnitId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Lista as últimas leituras de placa da unidade' })
  getRecentEvents(@Param('franchiseUnitId') franchiseUnitId: string) {
    return this.anprService.getRecentEvents(franchiseUnitId);
  }
}
