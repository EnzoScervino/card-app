import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';

function areStringArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

function areSettingsEqual(a: UserSettings, b: UserSettings): boolean {
  return (
    a.pointValue === b.pointValue &&
    a.mileValue === b.mileValue &&
    a.defaultPurchaseAmount === b.defaultPurchaseAmount &&
    a.hasCompletedOnboarding === b.hasCompletedOnboarding
  );
}

function areCategoryArraysEqual(a?: Category[], b?: Category[]): boolean {
  if (!a?.length && !b?.length) {
    return true;
  }

  const safeA = a ?? [];
  const safeB = b ?? [];

  if (safeA.length !== safeB.length) {
    return false;
  }

  for (let i = 0; i < safeA.length; i += 1) {
    if (safeA[i] !== safeB[i]) {
      return false;
    }
  }

  return true;
}

function areBonusSelectionsEqual(
  a: Record<string, CardBonusSelection>,
  b: Record<string, CardBonusSelection>
): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!b[key]) return false;
    if (a[key].selectedCategory !== b[key].selectedCategory) return false;
    if (!areCategoryArraysEqual(a[key].selectedCategories, b[key].selectedCategories)) return false;
    if (a[key].firstYearBonus !== b[key].firstYearBonus) return false;
  }
  return true;
}
import { defaultCards } from '@/mocks/cards';
import { UserSettings, Category, CardResult, CardBonusSelection } from '@/types';
import { calculateRewards } from '@/services/rewardCalculator';

const STORAGE_KEYS = {
  SELECTED_CARDS: 'cardwise_selected_cards',
  SETTINGS: 'cardwise_settings',
  BONUS_SELECTIONS: 'cardwise_bonus_selections',
};

const DEFAULT_SETTINGS: UserSettings = {
  pointValue: 0.015,
  mileValue: 0.012,
  defaultPurchaseAmount: 50,
  hasCompletedOnboarding: true,
};

export const [CardWiseProvider, useCardWise] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [bonusSelections, setBonusSelections] = useState<Record<string, CardBonusSelection>>({});

  const selectedCardsQuery = useQuery({
    queryKey: ['selectedCards'],
    queryFn: async () => {
      console.log('[CardWiseProvider] Loading selected cards from storage');
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_CARDS);
      return stored ? (JSON.parse(stored) as string[]) : [];
    },
  });

  const bonusSelectionsQuery = useQuery({
    queryKey: ['bonusSelections'],
    queryFn: async () => {
      console.log('[CardWiseProvider] Loading bonus selections from storage');
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.BONUS_SELECTIONS);
      return stored ? (JSON.parse(stored) as Record<string, CardBonusSelection>) : {};
    },
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      console.log('[CardWiseProvider] Loading settings from storage');
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? { ...DEFAULT_SETTINGS, ...(JSON.parse(stored) as Partial<UserSettings>) } : DEFAULT_SETTINGS;
    },
  });

  const saveBonusSelectionsMutation = useMutation({
    mutationFn: async (selections: Record<string, CardBonusSelection>) => {
      await AsyncStorage.setItem(STORAGE_KEYS.BONUS_SELECTIONS, JSON.stringify(selections));
      return selections;
    },
    onSuccess: (selections) => {
      queryClient.setQueryData(['bonusSelections'], selections);
    },
  });

  const saveCardsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_CARDS, JSON.stringify(ids));
      return ids;
    },
    onSuccess: (ids) => {
      queryClient.setQueryData(['selectedCards'], ids);
    },
  });

  useEffect(() => {
    if (!selectedCardsQuery.data) {
      return;
    }

    const validCardIds = new Set(defaultCards.map((card) => card.id));
    const sanitizedSelectedCards = selectedCardsQuery.data.filter((cardId) => validCardIds.has(cardId));

    if (sanitizedSelectedCards.length !== selectedCardsQuery.data.length) {
      console.log('[CardWiseProvider] Removed discontinued cards from saved wallet selection');
      saveCardsMutation.mutate(sanitizedSelectedCards);
    }

    setSelectedCardIds((prev) => {
      if (areStringArraysEqual(prev, sanitizedSelectedCards)) {
        return prev;
      }
      return sanitizedSelectedCards;
    });
  }, [selectedCardsQuery.data, saveCardsMutation]);

  useEffect(() => {
    if (!bonusSelectionsQuery.data) return;
    setBonusSelections((prev) => {
      if (areBonusSelectionsEqual(prev, bonusSelectionsQuery.data)) return prev;
      return bonusSelectionsQuery.data;
    });
  }, [bonusSelectionsQuery.data]);

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    setSettings((prev) => {
      if (areSettingsEqual(prev, settingsQuery.data)) {
        return prev;
      }
      return settingsQuery.data;
    });
  }, [settingsQuery.data]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: UserSettings) => {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      return newSettings;
    },
    onSuccess: (newSettings) => {
      queryClient.setQueryData(['settings'], newSettings);
    },
  });

  const toggleCard = useCallback((cardId: string) => {
    setSelectedCardIds((prev) => {
      const updated = prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId];
      saveCardsMutation.mutate(updated);
      return updated;
    });
  }, [saveCardsMutation]);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      saveSettingsMutation.mutate(updated);
      return updated;
    });
  }, [saveSettingsMutation]);

  const completeOnboarding = useCallback(() => {
    updateSettings({ hasCompletedOnboarding: true });
  }, [updateSettings]);

  const updateBonusSelection = useCallback((cardId: string, selection: Partial<CardBonusSelection>) => {
    setBonusSelections((prev) => {
      const card = defaultCards.find((c) => c.id === cardId);
      const defaultCat = card?.selectableBonus?.defaultCategory ?? 'gas';
      const defaultCategories = card?.selectableBonus?.defaultCategories ?? [defaultCat];
      const existing = prev[cardId] ?? {
        selectedCategory: defaultCat,
        selectedCategories: defaultCategories,
        firstYearBonus: false,
      };
      const normalizedSelectedCategories = selection.selectedCategories ?? existing.selectedCategories ?? defaultCategories;
      const updatedSelection: CardBonusSelection = {
        ...existing,
        ...selection,
        selectedCategory: selection.selectedCategory ?? normalizedSelectedCategories[0] ?? defaultCat,
        selectedCategories: normalizedSelectedCategories,
      };
      const updated = { ...prev, [cardId]: updatedSelection };
      saveBonusSelectionsMutation.mutate(updated);
      return updated;
    });
  }, [saveBonusSelectionsMutation]);

  const getBonusSelection = useCallback((cardId: string): CardBonusSelection => {
    const card = defaultCards.find((c) => c.id === cardId);
    const defaultCat = card?.selectableBonus?.defaultCategory ?? 'gas';
    const defaultCategories = card?.selectableBonus?.defaultCategories ?? [defaultCat];
    const existing = bonusSelections[cardId];

    return existing ?? {
      selectedCategory: defaultCat,
      selectedCategories: defaultCategories,
      firstYearBonus: false,
    };
  }, [bonusSelections]);

  const allCards = defaultCards;

  const selectedCards = useMemo(
    () => allCards.filter((c) => selectedCardIds.includes(c.id)),
    [allCards, selectedCardIds]
  );

  const getRecommendation = useCallback(
    (category: Category, amount: number): CardResult[] => {
      if (selectedCards.length === 0) return [];
      return calculateRewards(selectedCards, category, amount, settings, bonusSelections);
    },
    [selectedCards, settings, bonusSelections]
  );

  const isLoading = selectedCardsQuery.isLoading || settingsQuery.isLoading || bonusSelectionsQuery.isLoading;

  return useMemo(() => ({
    allCards,
    selectedCardIds,
    selectedCards,
    settings,
    isLoading,
    toggleCard,
    updateSettings,
    completeOnboarding,
    getRecommendation,
    bonusSelections,
    updateBonusSelection,
    getBonusSelection,
  }), [
    allCards,
    selectedCardIds,
    selectedCards,
    settings,
    isLoading,
    toggleCard,
    updateSettings,
    completeOnboarding,
    getRecommendation,
    bonusSelections,
    updateBonusSelection,
    getBonusSelection,
  ]);
});
