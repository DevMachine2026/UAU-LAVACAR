import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Carteira do cliente autenticado (mobile)' })
  getMyWallet(@CurrentUser() user: User) {
    return this.walletService.getWalletForUser(user.id);
  }

  @Get('me/statement')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Extrato da carteira do cliente autenticado (mobile)' })
  getMyStatement(@CurrentUser() user: User) {
    return this.walletService.getStatementForUser(user.id);
  }

  @Get('customer/:customerId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Busca o saldo e o extrato da carteira de um cliente' })
  getWallet(@Param('customerId') customerId: string, @CurrentUser() user: User) {
    // [SECURITY] IDOR fix - 2026-06-22
    if (user.role === UserRole.CUSTOMER) {
      return this.walletService.getWalletForUser(user.id);
    }
    return this.walletService.getWallet(customerId);
  }

  @Post('movement')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Adiciona um movimento na carteira (Crédito, Débito, Estorno)' })
  addMovement(@Body() createDto: CreateMovementDto) {
    return this.walletService.addMovement(createDto);
  }
}
