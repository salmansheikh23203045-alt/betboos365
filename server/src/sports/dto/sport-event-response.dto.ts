export class SportEventResponseDto {
  id!: string;
  sport!: string;
  league!: string;
  homeTeam!: string;
  awayTeam!: string;
  startTime!: string;
  isLive!: boolean;
  homeOdds!: number;
  drawOdds!: number;
  awayOdds!: number;
  homeScore?: number;
  awayScore?: number;
  status!: string;
}
