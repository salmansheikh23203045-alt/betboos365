import { Controller, Get, Param, Query } from '@nestjs/common';
import { SportsService } from './sports.service';
import { SportEventQueryDto } from './dto';
import { Public } from '../common/decorators';

@Controller('sports')
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Public()
  @Get()
  findAll(@Query() query: SportEventQueryDto) {
    return this.sportsService.findAll(query);
  }

  @Public()
  @Get('live')
  getLiveScores() {
    return this.sportsService.getLiveScores();
  }

  @Public()
  @Get('types')
  getSports() {
    return this.sportsService.getSports();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sportsService.findById(id);
  }
}
