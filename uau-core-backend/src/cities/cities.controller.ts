import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('cities')
@ApiBearerAuth()
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as cidades (opcional: filtrar por ?stateId=)' })
  @ApiQuery({ name: 'stateId', required: false })
  findAll(@Query('stateId') stateId?: string) {
    return this.citiesService.findAll(stateId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma cidade pelo ID' })
  findOne(@Param('id') id: string) {
    return this.citiesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria uma cidade' })
  create(@Body() dto: CreateCityDto) {
    return this.citiesService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza uma cidade' })
  update(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    return this.citiesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma cidade' })
  remove(@Param('id') id: string) {
    return this.citiesService.remove(id);
  }
}
