import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BetaAccessDto, UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Retorna o perfil do usuário autenticado (com carteira para clientes)' })
  getMe(@CurrentUser() user: User) {
    return this.usersService.getMe(user);
  }

  @Patch(':id/beta-access')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Libera ou revoga acesso beta de um usuário (apenas SUPER_ADMIN)' })
  updateBetaAccess(@Param('id') id: string, @Body() dto: BetaAccessDto) {
    return this.usersService.updateBetaAccess(id, dto.grant);
  }
}
