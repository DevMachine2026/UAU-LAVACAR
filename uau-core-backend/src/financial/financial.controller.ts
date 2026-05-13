// uau-core-backend/src/financial/financial.controller.ts
import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { UpdateFranchiseRuleDto } from './dto/update-franchise-rule.dto';
import { GenerateReportDto } from './dto/generate-report.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('financial')
@ApiBearerAuth()
@Controller('financial')
export class FinancialController {
  constructor(private readonly svc: FinancialService) {}

  // ===== OVERVIEW & FLOAT =====

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'Visão geral financeira' })
  getOverview(@Query('unitId') unitId?: string) {
    return this.svc.getFinancialOverview(unitId);
  }

  @Get('float')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Float de cashback em circulação' })
  getFloat() {
    return this.svc.getFinancialFloat();
  }

  // ===== LEDGER =====

  @Post('ledger')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Adiciona entrada manual ao livro razão' })
  createLedgerEntry(@Body() dto: CreateLedgerEntryDto) {
    return this.svc.createLedgerEntry(dto);
  }

  @Get('ledger')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOperation({ summary: 'Extrato financeiro com filtros e paginação' })
  getLedger(
    @Query('unitId') unitId?: string,
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getLedger({
      unitId,
      userId,
      type,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('ledger/unit/:unitId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Extrato da unidade (compatibilidade)' })
  getLedgerByUnit(@Param('unitId') unitId: string) {
    return this.svc.getLedgerByUnit(unitId);
  }

  // ===== FRANCHISE RULES =====

  @Get('franchise-rules')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Lista todas as regras de franquia' })
  getAllRules() {
    return this.svc.getAllFranchiseRules();
  }

  @Post('franchise-rules')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria ou atualiza regra de franquia para uma unidade' })
  createRule(@Body() dto: UpdateFranchiseRuleDto & { unitId: string }) {
    return this.svc.createFranchiseRule(dto);
  }

  @Put('franchise-rules/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza regra de franquia pelo ID' })
  updateRule(@Param('id') id: string, @Body() dto: UpdateFranchiseRuleDto) {
    return this.svc.updateFranchiseRuleById(id, dto);
  }

  @Get('rules/:unitId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Regra de uma unidade específica (compatibilidade)' })
  getRuleByUnit(@Param('unitId') unitId: string) {
    return this.svc.getFranchiseRule(unitId);
  }

  @Put('rules/:unitId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza regra por unidade (compatibilidade)' })
  updateRuleByUnit(@Param('unitId') unitId: string, @Body() dto: UpdateFranchiseRuleDto) {
    return this.svc.updateFranchiseRule(unitId, dto);
  }

  // ===== FRANCHISE REPORTS =====

  @Get('franchise-reports')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Lista relatórios de franquia' })
  getReports() {
    return this.svc.getFranchiseReports();
  }

  @Post('franchise-reports/generate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Gera um relatório de período para a franquia' })
  generateReport(@Body() dto: GenerateReportDto) {
    return this.svc.generateFranchiseReport(dto);
  }

  @Post('franchise-reports/:id/close')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Fecha um relatório de franquia' })
  closeReport(@Param('id') id: string) {
    return this.svc.closeFranchiseReport(id);
  }
}
