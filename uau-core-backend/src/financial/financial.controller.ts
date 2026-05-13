import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { UpdateFranchiseRuleDto } from './dto/update-franchise-rule.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('financial')
@ApiBearerAuth()
@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('ledger')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Adiciona uma transação manual ao Livro Razão' })
  createLedgerEntry(@Body() createDto: CreateLedgerEntryDto) {
    return this.financialService.createLedgerEntry(createDto);
  }

  @Get('ledger/unit/:unitId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Extrato financeiro da unidade' })
  getLedgerByUnit(@Param('unitId') unitId: string) {
    return this.financialService.getLedgerByUnit(unitId);
  }

  @Get('rules/:unitId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Busca regras de comissionamento da franquia' })
  getFranchiseRule(@Param('unitId') unitId: string) {
    return this.financialService.getFranchiseRule(unitId);
  }

  @Put('rules/:unitId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza regras de comissionamento da franquia' })
  updateFranchiseRule(@Param('unitId') unitId: string, @Body() updateDto: UpdateFranchiseRuleDto) {
    return this.financialService.updateFranchiseRule(unitId, updateDto);
  }

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Visão geral financeira (dashboard)' })
  getOverview(@Query('unitId') unitId?: string) {
    return this.financialService.getFinancialOverview(unitId);
  }
}
