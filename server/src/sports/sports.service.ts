import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SPORTS_PROVIDER, SportsProvider } from './adapters/sports-provider.interface';
import { SportEventQueryDto } from './dto';

@Injectable()
export class SportsService {
  constructor(
    @Inject(SPORTS_PROVIDER)
    private readonly provider: SportsProvider,
  ) {}

  async findAll(query: SportEventQueryDto) {
    let events = query.liveOnly
      ? await this.provider.fetchLiveScores()
      : await this.provider.fetchEvents(query.sport);

    if (query.league) {
      events = events.filter((e) => e.league.toLowerCase().includes(query.league!.toLowerCase()));
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const total = events.length;
    const start = (page - 1) * limit;
    const data = events.slice(start, start + limit);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const event = await this.provider.fetchEventById(id);
    if (!event) throw new NotFoundException('Sport event not found');
    return event;
  }

  async getLiveScores() {
    return this.provider.fetchLiveScores();
  }

  async getSports() {
    const events = await this.provider.fetchEvents();
    return [...new Set(events.map((e) => e.sport))].sort();
  }
}
