import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PartnerQrDto, PartnerTransactionDto } from './dto/partner-transaction.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
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

  @Post(':id/transactions/preview')
  @Roles(UserRole.CUSTOMER, UserRole.PARTNER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Calcula preview de transação com parceiro (mobile)' })
  previewTransaction(@Param('id') id: string, @Body() dto: PartnerTransactionDto) {
    return this.partnersService.previewTransaction(id, dto);
  }

  @Post(':id/transactions/confirm')
  @Roles(UserRole.CUSTOMER, UserRole.PARTNER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Confirma transação com parceiro e aplica cashback (mobile)' })
  confirmTransaction(@Param('id') id: string, @Body() dto: PartnerTransactionDto) {
    return this.partnersService.confirmTransaction(id, dto);
  }

  @Post(':id/transactions/create-qr')
  @Roles(UserRole.CUSTOMER, UserRole.PARTNER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Gera QR code para transação com parceiro (mobile)' })
  createQr(@Param('id') id: string, @Body() dto: PartnerQrDto, @CurrentUser() user: User) {
    const payload = { ...dto, customerUserId: dto.customerUserId ?? user.id };
    return this.partnersService.createQr(id, payload);
  }
}
