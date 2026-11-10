import { Module } from '@nestjs/common';
import { SportsService } from './sports.service';
import { SportsController } from './sports.controller';
import { MockSportsAdapter } from './adapters/mock-sports.adapter';
import { SPORTS_PROVIDER } from './adapters/sports-provider.interface';

@Module({
  controllers: [SportsController],
  providers: [
    SportsService,
    { provide: SPORTS_PROVIDER, useClass: MockSportsAdapter },
  ],
  exports: [SportsService],
})
export class SportsModule {}
