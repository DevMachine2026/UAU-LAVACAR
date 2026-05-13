import { Controller, Get, Post, Patch, Put, Body, Param, Query } from '@nestjs/common';
import { AntifraudService } from './antifraud.service';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('antifraud')
@ApiBearerAuth()
@Controller('antifraud')
export class AntifraudController {
  constructor(private readonly svc: AntifraudService) {}

  @Get('security-logs')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiOperation({ summary: 'Lista logs de segurança' })
  getSecurityLogs(
    @Query('eventType') eventType?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.svc.getSecurityLogs({ eventType, userId, startDate, endDate });
  }

  @Post('flags')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria flag de fraude' })
  createFlag(@Body() dto: CreateFlagDto) {
    return this.svc.createFlag(dto);
  }

  @Get('flags')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiOperation({ summary: 'Lista flags de fraude com filtros' })
  getFlags(
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('type') type?: string,
  ) {
    return this.svc.findAllFlags({ status, severity, type });
  }

  @Get('flags/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Detalhe de uma flag' })
  getFlag(@Param('id') id: string) {
    return this.svc.findFlag(id);
  }

  @Patch('flags/:id/review')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Revisar flag (REVIEWED, DISMISSED, BLOCKED)' })
  reviewFlag(@Param('id') id: string, @Body() payload: { status: string; reason?: string }) {
    return this.svc.reviewFlag(id, payload);
  }

  @Put('flags/:id/resolve')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Resolver flag (compatibilidade)' })
  resolveFlag(@Param('id') id: string, @Body() dto: UpdateFlagDto) {
    return this.svc.resolveFlag(id, dto);
  }

  @Post('users/:userId/mark-suspect')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Marca usuário como suspeito' })
  markSuspect(@Param('userId') userId: string, @Body('reason') reason: string) {
    return this.svc.markUserSuspect(userId, reason);
  }

  @Post('users/:userId/block')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Bloqueia usuário' })
  blockUser(@Param('userId') userId: string, @Body('reason') reason: string) {
    return this.svc.blockUser(userId, reason);
  }

  @Post('users/:userId/unblock')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Desbloqueia usuário' })
  unblockUser(@Param('userId') userId: string, @Body('reason') reason: string) {
    return this.svc.unblockUser(userId, reason);
  }
}
