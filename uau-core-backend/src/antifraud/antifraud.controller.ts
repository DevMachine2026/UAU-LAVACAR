import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { AntifraudService } from './antifraud.service';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('antifraud')
@ApiBearerAuth()
@Controller('antifraud')
export class AntifraudController {
  constructor(private readonly antifraudService: AntifraudService) {}

  @Post('flags')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria uma flag de fraude manualmente (ou via sistema interno)' })
  createFlag(@Body() createDto: CreateFlagDto) {
    return this.antifraudService.createFlag(createDto);
  }

  @Get('flags')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Lista todas as flags de fraude' })
  findAllFlags() {
    return this.antifraudService.findAllFlags();
  }

  @Put('flags/:id/resolve')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Resolve uma flag (Demitir, Bloquear, etc)' })
  resolveFlag(@Param('id') id: string, @Body() updateDto: UpdateFlagDto) {
    return this.antifraudService.resolveFlag(id, updateDto);
  }
}
