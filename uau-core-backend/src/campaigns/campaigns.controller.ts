import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria uma nova campanha' })
  create(@Body() createDto: CreateCampaignDto) {
    return this.campaignsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as campanhas' })
  findAll() {
    return this.campaignsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma campanha pelo ID' })
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza uma campanha' })
  update(@Param('id') id: string, @Body() updateDto: UpdateCampaignDto) {
    return this.campaignsService.update(id, updateDto);
  }

  @Post(':id/view')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Registra visualização de campanha (mobile)' })
  trackView(@Param('id') id: string, @CurrentUser() user: User) {
    return this.campaignsService.trackView(id, user.id);
  }

  @Post(':id/click')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Registra clique em campanha (mobile)' })
  trackClick(@Param('id') id: string, @CurrentUser() user: User) {
    return this.campaignsService.trackClick(id, user.id);
  }

  @Post(':id/dismiss')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Registra dismiss de campanha (mobile)' })
  trackDismiss(@Param('id') id: string, @CurrentUser() user: User) {
    return this.campaignsService.trackDismiss(id, user.id);
  }
}
