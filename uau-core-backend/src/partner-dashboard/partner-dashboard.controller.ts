import { Controller, Get } from '@nestjs/common';
import { PartnerDashboardService } from './partner-dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('partner-dashboard')
@ApiBearerAuth()
@Controller('partner-dashboard')
export class PartnerDashboardController {
  constructor(private readonly svc: PartnerDashboardService) {}

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Overview do portal parceiro' })
  getOverview(@CurrentUser() user: User) { return this.svc.getOverview(user); }

  @Get('financial')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'KPIs financeiros do parceiro' })
  getFinancial(@CurrentUser() user: User) { return this.svc.getFinancial(user); }

  @Get('transactions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Últimas transações do parceiro' })
  getTransactions(@CurrentUser() user: User) { return this.svc.getTransactions(user); }

  @Get('alerts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Alertas do parceiro' })
  getAlerts(@CurrentUser() user: User) { return this.svc.getAlerts(user); }

  @Get('campaigns')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Campanhas ativas do parceiro autenticado' })
  getCampaigns(@CurrentUser() user: User) { return this.svc.getCampaigns(user); }

  @Get('customers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Clientes que transacionaram com o parceiro autenticado' })
  getCustomers(@CurrentUser() user: User) { return this.svc.getCustomers(user); }
}
