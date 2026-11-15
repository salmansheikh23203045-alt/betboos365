import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  Roles,
  CurrentUser,
  PlayerOnly,
  RequirePermissions,
  AllowPendingPasswordChange,
} from '../common/decorators';
import { Permission, Role } from '../common/interfaces';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @AllowPendingPasswordChange()
  async getMe(@CurrentUser() actor: { id: string; permissions: Permission[] }) {
    const user = await this.usersService.findByIdOrFail(actor.id);
    // The session identity. `permissions` is the effective set computed on
    // the server; the dashboards use it only to decide what to show.
    return { ...this.usersService.toResponseDto(user), permissions: actor.permissions };
  }

  @Patch('me')
  @PlayerOnly()
  async updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(userId, dto);
    return this.usersService.toResponseDto(user);
  }

  @Get()
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.USERS_VIEW)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.usersService.findAll(page, limit);
    return {
      data: result.data.map((u) => this.usersService.toResponseDto(u)),
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.USERS_VIEW)
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findByIdOrFail(id);
    return this.usersService.toResponseDto(user);
  }
}
