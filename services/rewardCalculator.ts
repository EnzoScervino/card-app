import { CreditCard, Category, CardResult, UserSettings, CardBonusSelection } from '@/types';

export function isBiltRentDay(): boolean {
  const today = new Date();
  return today.getDate() === 1;
}

function isBiltCard(card: CreditCard): boolean {
  return card.issuer.toLowerCase() === 'bilt';
}

export function calculateRewards(
  cards: CreditCard[],
  category: Category,
  purchaseAmount: number,
  settings: UserSettings,
  bonusSelections?: Record<string, CardBonusSelection>
): CardResult[] {
  console.log('[RewardCalculator] Calculating for category:', category, 'amount:', purchaseAmount, 'cards:', cards.length);

  const safePointValue = Number.isFinite(settings.pointValue)
    ? Math.max(settings.pointValue, 0)
    : 0;
  const safeMileValue = Number.isFinite(settings.mileValue)
    ? Math.max(settings.mileValue, 0)
    : 0;

  const results: CardResult[] = cards.map((card) => {
    const rule = card.rules.find((r) => r.category === category);
    let baseRate = Number.isFinite(rule?.rewardRate)
      ? Math.max(rule?.rewardRate ?? 0, 0)
      : 0;

    let bonusCategoryBoost = false;
    let firstYearBoost = false;

    const selection = bonusSelections?.[card.id];

    if (card.selectableBonus && bonusSelections) {
      const selectedCategories = selection?.selectedCategories?.length
        ? selection.selectedCategories
        : [selection?.selectedCategory ?? card.selectableBonus.defaultCategory];
      if (selectedCategories.includes(category)) {
        baseRate = card.selectableBonus.bonusRate;
        bonusCategoryBoost = true;
        if (selection?.firstYearBonus) {
          baseRate += card.selectableBonus.firstYearBonusRate;
          firstYearBoost = true;
        }
      }
    }

    if (card.firstYearBonusConfig?.boostedRate && selection?.firstYearBonus) {
      baseRate = card.firstYearBonusConfig.boostedRate;
      firstYearBoost = true;
    }

    const biltBoostActive = isBiltCard(card) && isBiltRentDay();
    const rewardRate = biltBoostActive ? baseRate * 2 : baseRate;

    let estimatedReturn = 0;
    let normalizedReturn = 0;
    let effectiveRatePercent = 0;
    let explanation = '';
    let rankingNote = '';
    let displayAmount = '';
    let displayUnit = '';

    switch (card.rewardType) {
      case 'cashback': {
        estimatedReturn = (purchaseAmount * rewardRate) / 100;
        normalizedReturn = estimatedReturn;
        effectiveRatePercent = rewardRate;
        displayAmount = `${estimatedReturn.toFixed(2)}`;
        displayUnit = 'cash back';
        rankingNote = `${effectiveRatePercent.toFixed(2)}% effective return`;
        explanation = `${rewardRate}% cash back on this purchase`;
        break;
      }
      case 'points': {
        const pointsEarned = purchaseAmount * rewardRate;
        estimatedReturn = pointsEarned * safePointValue;
        normalizedReturn = estimatedReturn;
        effectiveRatePercent = rewardRate * safePointValue * 100;
        displayAmount = pointsEarned.toFixed(0);
        displayUnit = 'points';
        rankingNote = `${effectiveRatePercent.toFixed(2)}% effective return`;
        explanation = `${rewardRate}x points on this category`;
        break;
      }
      case 'miles': {
        const milesEarned = purchaseAmount * rewardRate;
        estimatedReturn = milesEarned * safeMileValue;
        normalizedReturn = estimatedReturn;
        effectiveRatePercent = rewardRate * safeMileValue * 100;
        displayAmount = milesEarned.toFixed(0);
        displayUnit = 'miles';
        rankingNote = `${effectiveRatePercent.toFixed(2)}% effective return`;
        explanation = `${rewardRate}x miles on this category`;
        break;
      }
    }

    if (rule?.capLimit) {
      explanation += ` (cap: ${rule.capLimit.toLocaleString()}/yr)`;
    }

    if (rule?.portalOnly) {
      explanation += ` (via ${rule.portalOnly})`;
    }

    return {
      card,
      estimatedReturn,
      normalizedReturn,
      effectiveRatePercent,
      rewardRate,
      rewardType: card.rewardType,
      explanation,
      rankingNote,
      displayAmount,
      displayUnit,
      portalOnly: rule?.portalOnly,
      caveat: rule?.caveat,
      biltRentDayBoost: biltBoostActive,
      bonusCategoryBoost,
      firstYearBoost,
    };
  });

  results.sort((a, b) => b.normalizedReturn - a.normalizedReturn);

  console.log(
    '[RewardCalculator] Results (normalized USD):',
    results.map((r) => `${r.card.name}: ${r.normalizedReturn.toFixed(2)} | ${r.rankingNote}`)
  );

  return results;
}

export function getRewardTypeLabel(type: string): string {
  switch (type) {
    case 'cashback':
      return 'Cash Back';
    case 'points':
      return 'Points';
    case 'miles':
      return 'Miles';
    default:
      return type;
  }
}
