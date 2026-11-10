import { GameCategory } from '@prisma/client';

const categoryToApi: Record<GameCategory, string> = {
  [GameCategory.slots]: 'slots',
  [GameCategory.table]: 'table',
  [GameCategory.live_casino]: 'live-casino',
  [GameCategory.esports]: 'esports',
  [GameCategory.fishing]: 'fishing',
  [GameCategory.arcade]: 'arcade',
};

const apiToCategory: Record<string, GameCategory> = {};
for (const [k, v] of Object.entries(categoryToApi)) {
  apiToCategory[v] = k as GameCategory;
}

export function gameCategoryToApi(cat: GameCategory): string {
  return categoryToApi[cat] ?? cat;
}

export function apiToGameCategory(api: string): GameCategory | undefined {
  return apiToCategory[api];
}
