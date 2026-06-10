import { Controller, Get, Query } from '@nestjs/common';
import { FranchiseDashboardService } from './franchise-dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('franchise-dashboard')
@ApiBearerAuth()
@Controller('franchise-dashboard')
export class FranchiseDashboardController {
  constructor(private readonly svc: FranchiseDashboardService) {}

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'Overview da franquia' })
  getOverview(@Query('unitId') unitId?: string) { return this.svc.getOverview(unitId); }

  @Get('financial')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'KPIs financeiros da franquia' })
  getFinancial(@Query('unitId') unitId?: string) { return this.svc.getFinancial(unitId); }

  @Get('operations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'KPIs operacionais da franquia' })
  getOperations(@Query('unitId') unitId?: string) { return this.svc.getOperations(unitId); }

  @Get('alerts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'Alertas da franquia' })
  getAlerts(@Query('unitId') unitId?: string) { return this.svc.getAlerts(unitId); }

  @Get('anpr')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'ANPR da franquia' })
  getAnpr(@Query('unitId') unitId?: string) { return this.svc.getAnpr(unitId); }

  @Get('customers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiOperation({ summary: 'Clientes da franquia com filtros' })
  getCustomers(
    @Query('unitId') unitId?: string,
    @Query('name') name?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.getCustomers({ unitId, name, status });
  }

  @Get('partners')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Parceiros associados à franquia do usuário autenticado' })
  getPartners(@CurrentUser() user: User) {
    return this.svc.getPartners(user);
  }
}
