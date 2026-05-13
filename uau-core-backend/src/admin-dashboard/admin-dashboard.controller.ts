import { Controller, Get } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('admin-dashboard')
@ApiBearerAuth()
@Controller('admin-dashboard')
export class AdminDashboardController {
  constructor(private readonly svc: AdminDashboardService) {}

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Overview geral do super admin' })
  getOverview() { return this.svc.getOverview(); }

  @Get('financial')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'KPIs financeiros do super admin' })
  getFinancial() { return this.svc.getFinancial(); }

  @Get('alerts')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Alertas críticos do sistema' })
  getAlerts() { return this.svc.getAlerts(); }

  @Get('operations')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'KPIs operacionais' })
  getOperations() { return this.svc.getOperations(); }

  @Get('anpr')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Resumo ANPR do dia' })
  getAnpr() { return this.svc.getAnpr(); }
}
