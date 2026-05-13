import { Controller, Get } from '@nestjs/common';
import { PartnerDashboardService } from './partner-dashboard.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('partner-dashboard')
@ApiBearerAuth()
@Controller('partner-dashboard')
export class PartnerDashboardController {
  constructor(private readonly svc: PartnerDashboardService) {}

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Overview do portal parceiro' })
  getOverview() { return this.svc.getOverview(); }

  @Get('financial')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'KPIs financeiros do parceiro' })
  getFinancial() { return this.svc.getFinancial(); }

  @Get('transactions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Últimas transações do parceiro' })
  getTransactions() { return this.svc.getTransactions(); }

  @Get('alerts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Alertas do parceiro' })
  getAlerts() { return this.svc.getAlerts(); }
}
