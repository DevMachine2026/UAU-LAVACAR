import { Controller, Get, Patch, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Lista notificações do cliente autenticado (mobile)' })
  findMine(@CurrentUser() user: User) {
    return this.notificationsService.findForUser(user.id);
  }

  @Get('me/unread-count')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Quantidade de notificações não lidas (mobile)' })
  getUnreadCount(@CurrentUser() user: User) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Marca uma notificação como lida (mobile)' })
  markAsRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Patch('read-all')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Marca todas as notificações como lidas (mobile)' })
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
