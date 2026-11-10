import { Controller, Get, Param, Query, Post, UseGuards } from '@nestjs/common';
import { GamesService } from './games.service';
import { GameQueryDto } from './dto';
import { Public, CurrentUser } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

  @UseGuards(JwtAuthGuard)
  @Post(':id/launch')
  async launchGame(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.gamesService.findById(id);
    await this.gamesService.recordLaunch(id, userId);
    return { message: 'Game launched', gameId: id };
  }
}
