import { Injectable } from '@nestjs/common';
import { SportsProvider, SportEventData } from './sports-provider.interface';

@Injectable()
export class MockSportsAdapter implements SportsProvider {
  private events: SportEventData[] = [
    { id: 'se-1', sport: 'Football', league: 'Premier League', homeTeam: 'Arsenal', awayTeam: 'Chelsea', startTime: 'Today 20:00', isLive: true, homeOdds: 1.85, drawOdds: 3.60, awayOdds: 4.20, homeScore: 1, awayScore: 0, status: 'live' },
    { id: 'se-2', sport: 'Football', league: 'La Liga', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', startTime: 'Today 22:00', isLive: false, homeOdds: 2.10, drawOdds: 3.40, awayOdds: 3.50, status: 'upcoming' },
    { id: 'se-3', sport: 'Football', league: 'Serie A', homeTeam: 'AC Milan', awayTeam: 'Inter Milan', startTime: 'Tomorrow 21:00', isLive: false, homeOdds: 2.65, drawOdds: 3.20, awayOdds: 2.70, status: 'upcoming' },
    { id: 'se-4', sport: 'Football', league: 'Bundesliga', homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', startTime: 'Tomorrow 19:30', isLive: false, homeOdds: 1.55, drawOdds: 4.20, awayOdds: 5.50, status: 'upcoming' },
    { id: 'se-5', sport: 'Basketball', league: 'NBA', homeTeam: 'Lakers', awayTeam: 'Celtics', startTime: 'Today 20:30', isLive: true, homeOdds: 1.75, drawOdds: 0, awayOdds: 2.10, homeScore: 88, awayScore: 92, status: 'live' },
    { id: 'se-6', sport: 'Basketball', league: 'NBA', homeTeam: 'Warriors', awayTeam: 'Nets', startTime: 'Tomorrow 22:00', isLive: false, homeOdds: 1.40, drawOdds: 0, awayOdds: 2.90, status: 'upcoming' },
    { id: 'se-7', sport: 'Tennis', league: 'ATP Finals', homeTeam: 'Djokovic', awayTeam: 'Alcaraz', startTime: 'Tomorrow 18:00', isLive: false, homeOdds: 2.20, drawOdds: 0, awayOdds: 1.70, status: 'upcoming' },
    { id: 'se-8', sport: 'Cricket', league: 'IPL', homeTeam: 'Mumbai Indians', awayTeam: 'Chennai Super Kings', startTime: 'Tomorrow 15:30', isLive: false, homeOdds: 1.90, drawOdds: 0, awayOdds: 1.95, status: 'upcoming' },
  ];

  getName() {
    return 'MockSportsAdapter';
  }

  async fetchEvents(sport?: string): Promise<SportEventData[]> {
    if (sport) {
      return this.events.filter((e) => e.sport.toLowerCase() === sport.toLowerCase());
    }
    return [...this.events];
  }

  async fetchLiveScores(): Promise<SportEventData[]> {
    return this.events.filter((e) => e.isLive);
  }

  async fetchEventById(id: string): Promise<SportEventData | null> {
    return this.events.find((e) => e.id === id) ?? null;
  }
}
