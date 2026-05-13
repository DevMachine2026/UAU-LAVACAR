import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { ManualAttendanceDto } from './dto/manual-attendance.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('operational')
@ApiBearerAuth()
@Controller('operational')
export class OperationsController {
  constructor(private readonly svc: OperationsService) {}

  @Get('reading-fields')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Lista campos de leitura para expedientes' })
  getReadingFields() {
    return this.svc.getReadingFields();
  }

  @Post('shifts/open')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Abre um expediente na unidade' })
  openShift(@Body() dto: OpenShiftDto) {
    return this.svc.openShift(dto);
  }

  @Get('shifts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiOperation({ summary: 'Lista expedientes com filtros opcionais' })
  getShifts(
    @Query('unitId') unitId?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.getShifts({ unitId, status });
  }

  @Get('shifts/:id/live-summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Resumo ao vivo do expediente' })
  getLiveSummary(@Param('id') id: string) {
    return this.svc.getLiveSummary(id);
  }

  @Post('shifts/:id/close')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Fecha um expediente aberto' })
  closeShift(@Param('id') id: string, @Body() dto: CloseShiftDto) {
    return this.svc.closeShift(id, dto);
  }

  @Get('shifts/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Busca expediente pelo ID' })
  getShift(@Param('id') id: string) {
    return this.svc.getShift(id);
  }

  @Post('attendances/manual')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Registra atendimento manual' })
  createManualAttendance(@Body() dto: ManualAttendanceDto) {
    return this.svc.createManualAttendance(dto);
  }

  @Patch('attendances/:id/complete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Conclui um atendimento' })
  completeAttendance(@Param('id') id: string) {
    return this.svc.completeAttendance(id);
  }

  @Patch('attendances/:id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Cancela um atendimento' })
  cancelAttendance(@Param('id') id: string) {
    return this.svc.cancelAttendance(id);
  }

  @Get('my-attendances')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR, UserRole.CUSTOMER)
  @ApiQuery({ name: 'userId', required: false })
  @ApiOperation({ summary: 'Lista atendimentos de um usuário' })
  getMyAttendances(@Query('userId') userId: string) {
    return this.svc.getMyAttendances(userId);
  }

  @Get('plate-check/:plate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'Verifica placa: assinatura, status, lavagem do dia' })
  checkPlate(@Param('plate') plate: string, @Query('unitId') unitId?: string) {
    return this.svc.checkPlate(plate, unitId);
  }

  @Post('plate-check/:plate/confirm-wash')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Confirma lavagem do dia para a placa' })
  confirmPlateWash(@Param('plate') plate: string, @Body() payload: { unitId: string; notes?: string }) {
    return this.svc.confirmPlateWash(plate, payload);
  }

  @Get('closures')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'Lista fechamentos de expediente' })
  getClosures(@Query('unitId') unitId?: string) {
    return this.svc.getClosures({ unitId });
  }

  @Get('closures/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Detalhe de um fechamento' })
  getClosure(@Param('id') id: string) {
    return this.svc.getClosure(id);
  }

  @Post('daily-washes/:id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Cancela lavagem diária (desfaz uso)' })
  cancelDailyWash(@Param('id') id: string) {
    return this.svc.cancelDailyWash(id);
  }
}
