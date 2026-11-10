export interface SportEventData {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  isLive: boolean;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  homeScore?: number;
  awayScore?: number;
  status: string;
}

export interface SportsProvider {
  getName(): string;
  fetchEvents(sport?: string): Promise<SportEventData[]>;
  fetchLiveScores(): Promise<SportEventData[]>;
  fetchEventById(id: string): Promise<SportEventData | null>;
}

export const SPORTS_PROVIDER = 'SPORTS_PROVIDER';
