import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { RegisterAttendanceDto } from './dto/register-attendance.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('operations')
@ApiBearerAuth()
@Controller('operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post('shifts/open')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Abre um turno em uma unidade' })
  openShift(@Body() openShiftDto: OpenShiftDto) {
    return this.operationsService.openShift(openShiftDto);
  }

  @Put('shifts/:id/close')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Fecha um turno aberto' })
  closeShift(@Param('id') id: string, @Body() closeShiftDto: CloseShiftDto) {
    return this.operationsService.closeShift(id, closeShiftDto);
  }

  @Get('shifts/active/:franchiseUnitId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Retorna o turno aberto atualmente na unidade' })
  getActiveShift(@Param('franchiseUnitId') franchiseUnitId: string) {
    return this.operationsService.getActiveShift(franchiseUnitId);
  }

  @Post('attendances')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Registra a lavagem de um veículo (atendimento)' })
  registerAttendance(@Body() registerDto: RegisterAttendanceDto) {
    return this.operationsService.registerAttendance(registerDto);
  }

  @Get('attendances/:franchiseUnitId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Lista os últimos atendimentos de uma unidade' })
  getAttendancesByUnit(@Param('franchiseUnitId') franchiseUnitId: string) {
    return this.operationsService.getAttendancesByUnit(franchiseUnitId);
  }
}
