import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('referrals')
@ApiBearerAuth()
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Registra uma nova indicação' })
  createReferral(@Body() createDto: CreateReferralDto) {
    return this.referralsService.createReferral(createDto);
  }

  @Get('me')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Rede de indicações do cliente autenticado (mobile)' })
  getMyNetwork(@CurrentUser() user: User) {
    return this.referralsService.getMyNetwork(user.id);
  }

  @Get('me/tree')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Árvore de indicações do cliente autenticado (mobile)' })
  getMyTree(@CurrentUser() user: User) {
    return this.referralsService.getMyTree(user.id);
  }

  @Get('summary/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Resumo das indicações de um usuário' })
  getReferralSummary(@Param('userId') userId: string) {
    return this.referralsService.getReferralSummary(userId);
  }

  @Get('tree/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Árvore de indicações de um usuário (admin)' })
  getReferralTree(@Param('userId') userId: string) {
    return this.referralsService.getMyTree(userId);
  }
}
