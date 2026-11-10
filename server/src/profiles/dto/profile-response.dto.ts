export class ProfileResponseDto {
  userId!: string;
  displayName!: string;
  avatarUrl!: string;
  preferredCurrency!: string;
  language!: string;
  timezone!: string;
  vipLevel!: number;
  totalDeposits!: number;
  totalWithdrawals!: number;
  activeBonuses!: number;
  gamesPlayed!: number;
  createdAt!: string;
}
