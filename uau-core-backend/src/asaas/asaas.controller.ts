import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AsaasService } from './asaas.service';
import { Public } from '../common/decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('asaas')
@Controller('asaas')
export class AsaasController {
  constructor(private readonly asaasService: AsaasService) {}

  @Public()
  @SkipThrottle()
  @Post('webhook')
  @ApiOperation({ summary: 'Recebe notificações (webhooks) do Asaas' })
  async handleWebhook(
    @Headers('asaas-access-token') token: string,
    @Body() payload: any,
  ) {
    // Valida o token do webhook configurado no Asaas
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (!expectedToken || token !== expectedToken) {
      throw new UnauthorizedException('Token de webhook inválido');
    }

    return this.asaasService.processWebhook(payload);
  }
}
