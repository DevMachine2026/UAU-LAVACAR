import { Controller, Get, Param } from '@nestjs/common';
import { StatesService } from './states.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('states')
@ApiBearerAuth()
@Controller('states')
export class StatesController {
  constructor(private readonly statesService: StatesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os estados' })
  findAll() {
    return this.statesService.findAll();
  }

  @Get(':stateId/cities')
  @ApiOperation({ summary: 'Lista as cidades de um estado' })
  findCitiesByState(@Param('stateId') stateId: string) {
    return this.statesService.findCitiesByState(stateId);
  }
}
