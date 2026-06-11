import { Controller, ForbiddenException, Get } from '@nestjs/common';
import { FranchiseDashboardService } from './franchise-dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('franchise-dashboard')
@ApiBearerAuth()
@Controller('franchise-dashboard')
export class FranchiseDashboardController {
  constructor(private readonly svc: FranchiseDashboardService) {}

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Overview da franquia' })
  getOverview(@CurrentUser() user: User) {
    const unitId = this.resolveUnitId(user);
    return this.svc.getOverview(unitId);
  }

  @Get('financial')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'KPIs financeiros da franquia' })
  getFinancial(@CurrentUser() user: User) {
    const unitId = this.resolveUnitId(user);
    return this.svc.getFinancial(unitId);
  }

  @Get('operations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'KPIs operacionais da franquia' })
  getOperations(@CurrentUser() user: User) {
    const unitId = this.resolveUnitId(user);
    return this.svc.getOperations(unitId);
  }

  @Get('alerts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Alertas da franquia' })
  getAlerts(@CurrentUser() user: User) {
    const unitId = this.resolveUnitId(user);
    return this.svc.getAlerts(unitId);
  }

  @Get('anpr')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'ANPR da franquia' })
  getAnpr(@CurrentUser() user: User) {
    const unitId = this.resolveUnitId(user);
    return this.svc.getAnpr(unitId);
  }

  @Get('customers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Clientes da franquia com filtros' })
  getCustomers(@CurrentUser() user: User) {
    const unitId = this.resolveUnitId(user);
    return this.svc.getCustomers({ unitId });
  }

  @Get('partners')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Parceiros associados à franquia do usuário autenticado' })
  getPartners(@CurrentUser() user: User) {
    return this.svc.getPartners(user);
  }

  private resolveUnitId(user: User): string | undefined {
    if (user.role !== UserRole.FRANCHISE_OWNER) return undefined;
    if (!user.defaultUnitId) {
      throw new ForbiddenException('Usuário sem unidade de franquia atribuída');
    }
    return user.defaultUnitId;
  }
}
