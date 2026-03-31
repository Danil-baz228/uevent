import { Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: { sub: string }) {
    return this.adminService.getOverview(user.sub);
  }

  @Get('users')
  listUsers(@CurrentUser() user: { sub: string }) {
    return this.adminService.listUsers(user.sub);
  }

  @Patch('users/:id/promote')
  promoteUser(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.adminService.promoteUser(id, user.sub);
  }

  @Patch('users/:id/revoke')
  revokeUser(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.adminService.revokeUser(id, user.sub);
  }

  @Delete('users/:id')
  removeUser(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.adminService.removeUser(id, user.sub);
  }

  @Get('events')
  listEvents(@CurrentUser() user: { sub: string }) {
    return this.adminService.listEvents(user.sub);
  }

  @Delete('events/:id')
  removeEvent(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.adminService.removeEvent(id, user.sub);
  }

  @Get('companies')
  listCompanies(@CurrentUser() user: { sub: string }) {
    return this.adminService.listCompanies(user.sub);
  }

  @Delete('companies/:id')
  removeCompany(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.adminService.removeCompany(id, user.sub);
  }

  @Get('comments')
  listComments(@CurrentUser() user: { sub: string }) {
    return this.adminService.listComments(user.sub);
  }

  @Delete('comments/:id')
  removeComment(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.adminService.removeComment(id, user.sub);
  }
}
