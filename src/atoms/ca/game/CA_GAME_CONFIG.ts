export const GAME_COSTS = {
  ROULETTE: 100,
  LUCKY_BOX: 100,
  ATTENDANCE: 0,
  RETRO_DRAW: 200,
} as const;

export type GameRewardItem = {
  amount: number;
  weight: number;
  label: string;
};

export const ROULETTE_REWARDS: GameRewardItem[] = [
  { amount: 30, weight: 30, label: '30p' },
  { amount: 10, weight: 40, label: '10p' },
  { amount: 50, weight: 18, label: '50p' },
  { amount: 100, weight: 8, label: '100p' },
  { amount: 500, weight: 3, label: '500p' },
  { amount: 1000, weight: 1, label: '1,000p' },
];

export const LUCKY_BOX_REWARDS: GameRewardItem[] = [
  { amount: 0, weight: 25, label: '꽝' },
  { amount: 10, weight: 45, label: '10p' },
  { amount: 50, weight: 18, label: '50p' },
  { amount: 100, weight: 8, label: '100p' },
  { amount: 500, weight: 3, label: '500p' },
  { amount: 1000, weight: 1, label: '1,000p' },
];
