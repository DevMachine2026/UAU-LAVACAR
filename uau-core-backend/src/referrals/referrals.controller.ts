import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
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

  @Get('summary/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Resumo das indicações de um usuário' })
  getReferralSummary(@Param('userId') userId: string) {
    return this.referralsService.getReferralSummary(userId);
  }
}
