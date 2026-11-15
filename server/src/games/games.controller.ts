import { Controller, Get, Param, Query, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { GamesService } from './games.service';
import { GameQueryDto, UpdateGameDto } from './dto';
import { Public, CurrentUser, Roles, RequirePermissions } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Permission, Role } from '../common/interfaces';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Public()
  @Get()
  findAll(@Query() query: GameQueryDto) {
    return this.gamesService.findAll(query);
  }

  @Public()
  @Get('categories')
  getCategories() {
    return this.gamesService.getCategories();
  }

  @Public()
  @Get('providers')
  getProviders() {
    return this.gamesService.getProviders();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gamesService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.CONTENT_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateGameDto) {
    return this.gamesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/launch')
  async launchGame(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.gamesService.findById(id);
    await this.gamesService.recordLaunch(id, userId);
    return { message: 'Game launched', gameId: id };
  }
}
