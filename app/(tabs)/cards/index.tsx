import React, { useRef, useCallback, useState, useMemo, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreditCard, Check, CircleDollarSign, Star, Plane as PlaneIcon, ChevronDown, Search, Settings2, Zap } from 'lucide-react-native';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCardWise } from '@/providers/CardWiseProvider';
import { CreditCard as CreditCardType, RewardType, Category, CategoryInfo } from '@/types';
import { useResponsive } from '@/hooks/useResponsive';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const rewardIcons: Record<RewardType, React.ReactNode> = {
  cashback: <CircleDollarSign size={12} color={Colors.dark.success} />,
  points: <Star size={12} color={Colors.dark.accent} />,
  miles: <PlaneIcon size={12} color={Colors.dark.cardBlue} />,
};

const rewardLabels: Record<RewardType, string> = {
  cashback: 'Cash Back',
  points: 'Points',
  miles: 'Miles',
};

function normalizeSearchValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getCardSearchTerms(card: CreditCardType): string[] {
  const issuer = card.issuer.trim();
  const name = card.name.trim();
  const combined = `${issuer} ${name}`.trim();

  return [
    issuer,
    name,
    combined,
    combined.replace(/\bcard\b/gi, '').replace(/\s+/g, ' ').trim(),
    `${issuer} ${name.replace(/\bcard\b/gi, '').replace(/\s+/g, ' ').trim()}`.trim(),
  ].filter((term, index, terms) => Boolean(term) && terms.indexOf(term) === index);
}

export default function CardsScreen() {
  const { allCards, selectedCardIds, toggleCard } = useCardWise();
  const { contentPadding } = useResponsive();
  const insets = useSafeAreaInsets();
  const [expandedIssuers, setExpandedIssuers] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleToggle = useCallback(
    (cardId: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleCard(cardId);
    },
    [toggleCard]
  );

  const toggleIssuer = useCallback((issuer: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.create(250, 'easeInEaseOut', 'opacity'));
    setExpandedIssuers((prev) => ({ ...prev, [issuer]: !prev[issuer] }));
  }, []);

  const selectedCount = selectedCardIds.length;

  useEffect(() => {
    console.log('[CardsScreen] Search query changed:', searchQuery);
  }, [searchQuery]);

  const normalizedSearchQuery = useMemo(() => normalizeSearchValue(searchQuery), [searchQuery]);

  const filteredCards = useMemo(() => {
    if (!normalizedSearchQuery) {
      return allCards;
    }

    return allCards.filter((card) => {
      const searchTerms = getCardSearchTerms(card);
      return searchTerms.some((term) => normalizeSearchValue(term).includes(normalizedSearchQuery));
    });
  }, [allCards, normalizedSearchQuery]);

  const groupedCards = useMemo(() => {
    return filteredCards.reduce(
      (acc, card) => {
        if (!acc[card.issuer]) acc[card.issuer] = [];
        acc[card.issuer].push(card);
        return acc;
      },
      {} as Record<string, CreditCardType[]>
    );
  }, [filteredCards]);

  const issuerStats = useMemo(() => {
    const stats: Record<string, { total: number; selected: number }> = {};
    for (const [issuer, cards] of Object.entries(groupedCards)) {
      const selected = cards.filter((c) => selectedCardIds.includes(c.id)).length;
      stats[issuer] = { total: cards.length, selected };
    }
    return stats;
  }, [groupedCards, selectedCardIds]);

  const sortedIssuerEntries = useMemo(() => {
    return Object.entries(groupedCards).sort((a, b) => {
      const cardCountDelta = b[1].length - a[1].length;
      if (cardCountDelta !== 0) {
        return cardCountDelta;
      }
      return a[0].localeCompare(b[0]);
    });
  }, [groupedCards]);

  const hasActiveSearch = normalizedSearchQuery.length > 0;
  const hasSearchResults = filteredCards.length > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#0A0A0F', '#10101A', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: contentPadding },
        ]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>

          <View style={styles.headerRow}>
            <Image
              source={require('@/assets/images/perkcalc-logo-transparent.png')}
              style={styles.headerLogo}
            />
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>My Wallet</Text>
              <Text style={styles.subtitle}>
                {selectedCount} card{selectedCount !== 1 ? 's' : ''} selected
              </Text>
            </View>
          </View>

          <View style={styles.searchWrap} testID="cards-search-container">
            <Search size={16} color={Colors.dark.textTertiary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by bank or card name"
              placeholderTextColor={Colors.dark.textTertiary}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              testID="cards-search-input"
            />
          </View>

          {hasActiveSearch && (
            <View style={styles.searchStatus} testID="cards-search-status">
              <Text style={[styles.searchStatusText, hasSearchResults ? styles.availableText : styles.unavailableText]}>
                {hasSearchResults
                  ? `Available on PerkCalc · ${filteredCards.length} card${filteredCards.length !== 1 ? 's' : ''} found`
                  : 'Not available on PerkCalc yet'}
              </Text>
            </View>
          )}
        </View>

        {sortedIssuerEntries.map(([issuer, cards]) => {
          const isExpanded = expandedIssuers[issuer] ?? false;
          const stats = issuerStats[issuer];

          return (
            <IssuerSection
              key={issuer}
              issuer={issuer}
              cards={cards}
              isExpanded={hasActiveSearch ? true : isExpanded}
              selectedCount={stats?.selected ?? 0}
              totalCount={stats?.total ?? 0}
              selectedCardIds={selectedCardIds}
              onToggleIssuer={toggleIssuer}
              onToggleCard={handleToggle}
            />
          );
        })}

        {hasActiveSearch && !hasSearchResults && (
          <View style={styles.emptyState} testID="cards-search-empty-state">
            <Text style={styles.emptyStateTitle}>Card not found</Text>
            <Text style={styles.emptyStateText}>
              Try a different bank name or card name to check if it's available on PerkCalc.
            </Text>
          </View>
        )}

        <View style={styles.disclaimer} testID="cards-security-disclaimer">
          <Text style={styles.disclaimerText}>
            Informational tool only. PerkCalc is not affiliated with or endorsed by any financial institution. Reward terms can change, so verify with the official issuer.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const IssuerSection = React.memo(function IssuerSection({
  issuer,
  cards,
  isExpanded,
  selectedCount,
  totalCount,
  selectedCardIds,
  onToggleIssuer,
  onToggleCard,
}: {
  issuer: string;
  cards: CreditCardType[];
  isExpanded: boolean;
  selectedCount: number;
  totalCount: number;
  selectedCardIds: string[];
  onToggleIssuer: (issuer: string) => void;
  onToggleCard: (id: string) => void;
}) {
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  const handlePress = useCallback(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    onToggleIssuer(issuer);
  }, [isExpanded, issuer, onToggleIssuer, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const previewColors = cards.slice(0, 4).map((c) => c.color);

  return (
    <View style={styles.section}>
      <Pressable
        onPress={handlePress}
        style={[styles.issuerHeader, isExpanded && styles.issuerHeaderExpanded]}
        testID={`issuer-${issuer}`}
      >
        <View style={styles.issuerLeft}>
          <View style={styles.colorDots}>
            {previewColors.map((color, i) => (
              <View
                key={i}
                style={[
                  styles.colorDot,
                  { backgroundColor: color, marginLeft: i > 0 ? -4 : 0 },
                ]}
              />
            ))}
          </View>
          <View>
            <Text style={styles.issuerName}>{issuer}</Text>
            <Text style={styles.issuerCount}>
              {totalCount} card{totalCount !== 1 ? 's' : ''}
              {selectedCount > 0 && (
                <Text style={styles.issuerSelected}> · {selectedCount} selected</Text>
              )}
            </Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown size={18} color={Colors.dark.textTertiary} />
        </Animated.View>
      </Pressable>

      {isExpanded && (
        <View style={styles.cardsList}>
          {cards.map((card) => {
            const isSelected = selectedCardIds.includes(card.id);
            return (
              <React.Fragment key={card.id}>
                <CardRow
                  card={card}
                  isSelected={isSelected}
                  onToggle={onToggleCard}
                />
                {isSelected && (card.selectableBonus || card.firstYearBonusConfig) && (
                  <BonusCategoryPicker card={card} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      )}
    </View>
  );
});

const rewardUnitLabels: Record<RewardType, string> = {
  cashback: 'cash back',
  points: 'points',
  miles: 'miles',
};

const BonusCategoryPicker = memo(function BonusCategoryPicker({ card }: { card: CreditCardType }) {
  const { getBonusSelection, updateBonusSelection } = useCardWise();
  const bonus = card.selectableBonus;
  const firstYearBonusConfig = card.firstYearBonusConfig;
  if (!bonus && !firstYearBonusConfig) return null;

  const selection = getBonusSelection(card.id);

  const maxSelections = bonus?.maxSelections ?? 1;
  const selectedCategories = useMemo<Category[]>(() => (
    selection.selectedCategories?.length
      ? selection.selectedCategories
      : [selection.selectedCategory]
  ), [selection.selectedCategories, selection.selectedCategory]);

  const handleCategorySelect = useCallback((cat: Category) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!bonus) {
      return;
    }

    if (maxSelections <= 1) {
      updateBonusSelection(card.id, {
        selectedCategory: cat,
        selectedCategories: [cat],
      });
      return;
    }

    const isActive = selectedCategories.includes(cat);
    let nextSelectedCategories: Category[];

    if (isActive) {
      if (selectedCategories.length <= 1) {
        return;
      }
      nextSelectedCategories = selectedCategories.filter((selectedCat) => selectedCat !== cat);
    } else if (selectedCategories.length >= maxSelections) {
      nextSelectedCategories = [...selectedCategories.slice(1), cat];
    } else {
      nextSelectedCategories = [...selectedCategories, cat];
    }

    updateBonusSelection(card.id, {
      selectedCategory: nextSelectedCategories[0] ?? cat,
      selectedCategories: nextSelectedCategories,
    });
  }, [bonus, card.id, maxSelections, selectedCategories, updateBonusSelection]);

  const handleFirstYearToggle = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateBonusSelection(card.id, { firstYearBonus: !selection.firstYearBonus });
  }, [card.id, selection.firstYearBonus, updateBonusSelection]);

  const effectiveRate = bonus
    ? (selection.firstYearBonus
      ? bonus.bonusRate + bonus.firstYearBonusRate
      : bonus.bonusRate)
    : firstYearBonusConfig?.boostedRate ?? 0;

  const hasFirstYearBonus = (bonus?.firstYearBonusRate ?? 0) > 0 || Boolean(firstYearBonusConfig);
  const rateUnit = card.rewardType === 'cashback'
    ? `${effectiveRate}% cash back`
    : `${effectiveRate}x ${rewardUnitLabels[card.rewardType]}`;

  const firstYearDescription = bonus
    ? `+${bonus.firstYearBonusRate}% extra on your chosen category`
    : `All categories earn ${firstYearBonusConfig?.boostedRate ?? 0}% during year one`;

  return (
    <View style={styles.bonusPickerContainer}>
      {bonus && (
        <>
          <View style={styles.bonusPickerHeader}>
            <Settings2 size={14} color={Colors.dark.accent} />
            <Text style={styles.bonusPickerTitle}>
              {maxSelections > 1
                ? `Choose ${maxSelections} categories for ${bonus.bonusRate}x`
                : `Choose your ${bonus.bonusRate}x category`}
            </Text>
          </View>

          <View style={styles.bonusCategoryGrid}>
            {bonus.eligibleCategories.map((cat) => {
              const isActive = selectedCategories.includes(cat);
              const info = CategoryInfo[cat];
              return (
                <Pressable
                  key={cat}
                  onPress={() => handleCategorySelect(cat)}
                  style={[
                    styles.bonusCategoryChip,
                    isActive && styles.bonusCategoryChipActive,
                  ]}
                  testID={`bonus-cat-${card.id}-${cat}`}
                >
                  <Text style={styles.bonusCategoryEmoji}>{info.emoji}</Text>
                  <Text style={[
                    styles.bonusCategoryLabel,
                    isActive && styles.bonusCategoryLabelActive,
                  ]}>{info.label}</Text>
                  {isActive && <Check size={12} color={Colors.dark.accent} />}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.bonusRateDisplay}>
            <Text style={styles.bonusRateText}>
              {selectedCategories.map((categoryKey) => `${CategoryInfo[categoryKey].emoji} ${CategoryInfo[categoryKey].label}`).join(' · ')}: <Text style={styles.bonusRateHighlight}>{rateUnit}</Text>
            </Text>
          </View>
        </>
      )}

      {!bonus && firstYearBonusConfig && (
        <View style={styles.bonusRateDisplay}>
          <Text style={styles.bonusRateText}>
            <Text style={styles.bonusRateHighlight}>{selection.firstYearBonus ? `${firstYearBonusConfig.boostedRate}% cash back` : '1.5% cash back'}</Text> on all categories
          </Text>
        </View>
      )}

      {hasFirstYearBonus && (
        <Pressable
          onPress={handleFirstYearToggle}
          style={[
            styles.firstYearToggle,
            selection.firstYearBonus && styles.firstYearToggleActive,
          ]}
          testID={`first-year-toggle-${card.id}`}
        >
          <View style={styles.firstYearToggleLeft}>
            <Zap size={14} color={selection.firstYearBonus ? '#22D3EE' : Colors.dark.textTertiary} fill={selection.firstYearBonus ? '#22D3EE' : 'transparent'} />
            <View>
              <Text style={[
                styles.firstYearToggleText,
                selection.firstYearBonus && styles.firstYearToggleTextActive,
              ]}>First-year bonus</Text>
              <Text style={styles.firstYearToggleDesc}>{firstYearDescription}</Text>
            </View>
          </View>
          <View style={[
            styles.toggleSwitch,
            selection.firstYearBonus && styles.toggleSwitchActive,
          ]}>
            <View style={[
              styles.toggleKnob,
              selection.firstYearBonus && styles.toggleKnobActive,
            ]} />
          </View>
        </Pressable>
      )}
    </View>
  );
});

const CardRow = React.memo(function CardRow({
  card,
  isSelected,
  onToggle,
}: {
  card: CreditCardType;
  isSelected: boolean;
  onToggle: (id: string) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
    onToggle(card.id);
  };

  const topRate = Math.max(...card.rules.map((r) => r.rewardRate));

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        style={[styles.cardRow, isSelected && styles.cardRowSelected]}
        testID={`card-row-${card.id}`}
      >
        <View style={[styles.cardChip, { backgroundColor: card.color }]}>
          <CreditCard size={16} color="#FFF" />
        </View>
        <View style={styles.cardDetails}>
          <Text style={styles.cardName}>{card.name}</Text>
          <View style={styles.cardMeta}>
            <View style={styles.rewardBadge}>
              {rewardIcons[card.rewardType]}
              <Text style={styles.rewardText}>
                {rewardLabels[card.rewardType]}
              </Text>
            </View>
            <Text style={styles.topRate}>Up to {topRate}x</Text>
            {card.annualFee > 0 && (
              <Text style={styles.annualFee}>${card.annualFee}/yr</Text>
            )}
            {card.annualFee === 0 && (
              <Text style={styles.noFee}>No fee</Text>
            )}
          </View>
        </View>
        <View
          style={[
            styles.selectCircle,
            isSelected && styles.selectCircleActive,
          ]}
        >
          {isSelected && <Check size={14} color="#FFF" />}
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  headerLogo: {
    width: 170,
    height: 106,
    marginRight: 14,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  searchWrap: {
    marginTop: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.surface,
    borderColor: Colors.dark.borderLight,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchStatus: {
    marginTop: 10,
  },
  searchStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  availableText: {
    color: Colors.dark.success,
  },
  unavailableText: {
    color: '#FF9F8E',
  },
  emptyState: {
    backgroundColor: Colors.dark.surface,
    borderColor: Colors.dark.borderLight,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 6,
  },
  emptyStateTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  emptyStateText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  section: {
    marginBottom: 8,
  },
  issuerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  issuerHeaderExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: Colors.dark.surfaceHighlight,
  },
  issuerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  colorDots: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    width: 36,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.dark.surface,
  },
  issuerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  issuerCount: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  issuerSelected: {
    color: Colors.dark.accent,
    fontWeight: '500' as const,
  },
  cardsList: {
    backgroundColor: Colors.dark.surface,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.dark.borderLight,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  cardRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardRowSelected: {
    borderColor: Colors.dark.accent,
    backgroundColor: Colors.dark.accentMuted,
  },
  cardChip: {
    width: 38,
    height: 26,
    borderRadius: 5,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cardDetails: {
    flex: 1,
    marginLeft: 10,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 3,
  },
  cardMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  rewardBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    backgroundColor: Colors.dark.surfaceHighlight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rewardText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  topRate: {
    fontSize: 11,
    color: Colors.dark.accent,
    fontWeight: '600' as const,
  },
  annualFee: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
  },
  noFee: {
    fontSize: 11,
    color: Colors.dark.success,
    fontWeight: '500' as const,
  },
  selectCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  selectCircleActive: {
    borderColor: Colors.dark.accent,
    backgroundColor: Colors.dark.accent,
  },
  bonusPickerContainer: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(226, 24, 55, 0.2)',
  },
  bonusPickerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 10,
  },
  bonusPickerTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
  bonusCategoryGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 10,
  },
  bonusCategoryChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bonusCategoryChipActive: {
    borderColor: Colors.dark.accent,
    backgroundColor: Colors.dark.accentMuted,
  },
  bonusCategoryEmoji: {
    fontSize: 13,
  },
  bonusCategoryLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.dark.textSecondary,
  },
  bonusCategoryLabelActive: {
    color: Colors.dark.accentLight,
  },
  bonusRateDisplay: {
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  bonusRateText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  bonusRateHighlight: {
    fontWeight: '700' as const,
    color: Colors.dark.accent,
  },
  firstYearToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  firstYearToggleActive: {
    borderColor: 'rgba(34, 211, 238, 0.3)',
    backgroundColor: 'rgba(34, 211, 238, 0.06)',
  },
  firstYearToggleLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },
  firstYearToggleText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  firstYearToggleTextActive: {
    color: '#22D3EE',
  },
  firstYearToggleDesc: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    marginTop: 1,
  },
  toggleSwitch: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.border,
    justifyContent: 'center' as const,
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#22D3EE',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.textSecondary,
  },
  toggleKnobActive: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-end' as const,
  },
  disclaimer: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 12,
  },
  disclaimerText: {
    color: Colors.dark.textTertiary,
    fontSize: 11,
    lineHeight: 16,
  },
});
