import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { VehicleSizesService } from './vehicle-sizes.service';
import { CreateVehicleSizeDto } from './dto/create-vehicle-size.dto';
import { UpdateVehicleSizeDto } from './dto/update-vehicle-size.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('vehicle-sizes')
@ApiBearerAuth()
@Controller('vehicle-sizes')
export class VehicleSizesController {
  constructor(private readonly vehicleSizesService: VehicleSizesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria uma nova categoria de tamanho de veículo' })
  create(@Body() createDto: CreateVehicleSizeDto) {
    return this.vehicleSizesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as categorias de tamanho' })
  findAll() {
    return this.vehicleSizesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma categoria de tamanho pelo ID' })
  findOne(@Param('id') id: string) {
    return this.vehicleSizesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza uma categoria de tamanho' })
  update(@Param('id') id: string, @Body() updateDto: UpdateVehicleSizeDto) {
    return this.vehicleSizesService.update(id, updateDto);
  }
}
