import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('customer/:customerId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Busca o saldo e o extrato da carteira de um cliente' })
  getWallet(@Param('customerId') customerId: string) {
    return this.walletService.getWallet(customerId);
  }

  @Post('movement')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Adiciona um movimento na carteira (Crédito, Débito, Estorno)' })
  addMovement(@Body() createDto: CreateMovementDto) {
    return this.walletService.addMovement(createDto);
  }
}
