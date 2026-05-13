import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('partners')
@ApiBearerAuth()
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Cria um novo parceiro' })
  create(@Body() createDto: CreatePartnerDto) {
    return this.partnersService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os parceiros' })
  findAll() {
    return this.partnersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um parceiro pelo ID' })
  findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Atualiza um parceiro' })
  update(@Param('id') id: string, @Body() updateDto: UpdatePartnerDto) {
    return this.partnersService.update(id, updateDto);
  }
}
