export type RewardType = 'cashback' | 'points' | 'miles';

export type Category =
  | 'restaurant'
  | 'grocery'
  | 'gas'
  | 'travel'
  | 'transport'
  | 'onlineShopping'
  | 'pharmacy'
  | 'streaming'
  | 'other';

export interface RewardRule {
  id: string;
  cardId: string;
  category: Category;
  rewardRate: number;
  capLimit?: number;
  portalOnly?: string;
  caveat?: string;
}

export interface SelectableBonusConfig {
  eligibleCategories: Category[];
  bonusRate: number;
  firstYearBonusRate: number;
  defaultCategory: Category;
}

export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  rewardType: RewardType;
  annualFee: number;
  color: string;
  rules: RewardRule[];
  selectableBonus?: SelectableBonusConfig;
}

export interface UserCard {
  cardId: string;
  isSelected: boolean;
}

export interface UserSettings {
  pointValue: number;
  mileValue: number;
  defaultPurchaseAmount: number;
  hasCompletedOnboarding: boolean;
}

export interface CardBonusSelection {
  selectedCategory: Category;
  firstYearBonus: boolean;
}

export interface CardResult {
  card: CreditCard;
  estimatedReturn: number;
  normalizedReturn: number;
  effectiveRatePercent: number;
  rewardRate: number;
  rewardType: RewardType;
  explanation: string;
  rankingNote: string;
  displayAmount: string;
  displayUnit: string;
  portalOnly?: string;
  caveat?: string;
  biltRentDayBoost?: boolean;
  bonusCategoryBoost?: boolean;
  firstYearBoost?: boolean;
}

export const CategoryInfo: Record<Category, { label: string; emoji: string }> = {
  restaurant: { label: 'Restaurants', emoji: '🍽️' },
  grocery: { label: 'Grocery', emoji: '🛒' },
  gas: { label: 'Gas', emoji: '⛽' },
  travel: { label: 'Travel', emoji: '✈️' },
  transport: { label: 'Transport', emoji: '🚗' },
  onlineShopping: { label: 'Online Shopping', emoji: '🛍️' },
  pharmacy: { label: 'Pharmacy', emoji: '💊' },
  streaming: { label: 'Streaming', emoji: '📺' },
  other: { label: 'Other', emoji: '💳' },
};
