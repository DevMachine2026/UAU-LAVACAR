import { Controller, Get, Body, Param, Put } from '@nestjs/common';
import { AdminSettingsService } from './admin-settings.service';
import { UpdateAdminSettingDto } from './dto/update-admin-setting.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('admin-settings')
@ApiBearerAuth()
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin-settings')
export class AdminSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as configurações globais (Apenas Super Admin)' })
  findAll() {
    return this.adminSettingsService.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Busca uma configuração específica' })
  findOne(@Param('key') key: string) {
    return this.adminSettingsService.findOne(key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Atualiza ou cria uma configuração' })
  update(
    @Param('key') key: string,
    @Body() updateAdminSettingDto: UpdateAdminSettingDto,
  ) {
    return this.adminSettingsService.update(key, updateAdminSettingDto);
  }
}
