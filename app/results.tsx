import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Trophy, CreditCard, Info, Globe, AlertTriangle, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useCardWise } from '@/providers/CardWiseProvider';
import { Category, CategoryInfo, CardResult } from '@/types';
import { getRewardTypeLabel, isBiltRentDay } from '@/services/rewardCalculator';
import { useResponsive } from '@/hooks/useResponsive';

const rankEmojis = ['🥇', '🥈', '🥉'];
const rankLabels = ['Best Option', '2nd Best', '3rd Best'];

export default function ResultsScreen() {
  const { category, amount } = useLocalSearchParams<{
    category: string;
    amount: string;
  }>();
  const { getRecommendation } = useCardWise();
  const { contentPadding } = useResponsive();

  const purchaseAmount = parseFloat(amount || '50');
  const cat = (category || 'other') as Category;
  const catInfo = CategoryInfo[cat];

  const results = useMemo(
    () => getRecommendation(cat, purchaseAmount),
    [cat, purchaseAmount, getRecommendation]
  );

  const fadeAnims = useRef<Animated.Value[]>(
    results.map(() => new Animated.Value(0))
  ).current;
  const slideAnims = useRef<Animated.Value[]>(
    results.map(() => new Animated.Value(30))
  ).current;

  useEffect(() => {
    results.forEach((_, i) => {
      Animated.parallel([
        Animated.timing(fadeAnims[i], {
          toValue: 1,
          duration: 500,
          delay: i * 120,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnims[i], {
          toValue: 0,
          duration: 500,
          delay: i * 120,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnims, results, slideAnims]);

  const bestReturn = results.length > 0 ? results[0].normalizedReturn : 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerStyle: { backgroundColor: Colors.dark.background },
          headerTintColor: Colors.dark.text,
          headerShadowVisible: false,
        }}
      />

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
        <View style={styles.header}>
          <Text style={styles.categoryEmoji}>{catInfo.emoji}</Text>
          <Text style={styles.headerTitle}>{catInfo.label}</Text>
          <Text style={styles.headerAmount}>${purchaseAmount.toFixed(2)} purchase</Text>
        </View>

        {isBiltRentDay() && (
          <View style={styles.rentDayBanner}>
            <Zap size={14} color="#22D3EE" fill="#22D3EE" />
            <Text style={styles.rentDayBannerText}>Bilt Rent Day — All Bilt cards earn 2x points today!</Text>
          </View>
        )}

        {results.length === 0 ? (
          <View style={styles.emptyState}>
            <CreditCard size={48} color={Colors.dark.textTertiary} />
            <Text style={styles.emptyTitle}>No cards to compare</Text>
            <Text style={styles.emptySubtitle}>Add cards to your wallet first</Text>
          </View>
        ) : (
          <View style={styles.resultsList}>
            {results.map((result, index) => (
              <Animated.View
                key={result.card.id}
                style={{
                  opacity: fadeAnims[index] ?? new Animated.Value(1),
                  transform: [
                    { translateY: slideAnims[index] ?? new Animated.Value(0) },
                  ],
                }}
              >
                <ResultCard
                  result={result}
                  index={index}
                  isTop={index === 0}
                  bestReturn={bestReturn}
                  purchaseAmount={purchaseAmount}
                />
              </Animated.View>
            ))}
          </View>
        )}

        <View style={styles.disclaimer} testID="results-security-disclaimer">
          <Info size={14} color={Colors.dark.textTertiary} />
          <Text style={styles.disclaimerText}>
            For informational use only. PerkCalc is not affiliated with or endorsed by any financial institution. Reward rates may change and should be verified with the official issuer.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function ResultCard({
  result,
  index,
  isTop,
  bestReturn,
  purchaseAmount,
}: {
  result: CardResult;
  index: number;
  isTop: boolean;
  bestReturn: number;
  purchaseAmount: number;
}) {
  const percentage =
    bestReturn > 0 ? (result.normalizedReturn / bestReturn) * 100 : 0;
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: percentage,
      duration: 800,
      delay: index * 120 + 300,
      useNativeDriver: false,
    }).start();
  }, [barWidth, index, percentage]);

  const calcBreakdown = useMemo(() => {
    const formattedAmount = `${purchaseAmount.toFixed(2)}`;

    if (result.rewardType === 'cashback') {
      return `${formattedAmount} × ${result.rewardRate}% = ${result.estimatedReturn.toFixed(2)}`;
    }

    if (result.rewardType === 'points') {
      const pointsEarned = purchaseAmount * result.rewardRate;
      return `${formattedAmount} × ${result.rewardRate}x = ${pointsEarned.toFixed(0)} pts`;
    }

    const milesEarned = purchaseAmount * result.rewardRate;
    return `${formattedAmount} × ${result.rewardRate}x = ${milesEarned.toFixed(0)} mi`;
  }, [purchaseAmount, result.estimatedReturn, result.rewardRate, result.rewardType]);

  return (
    <View style={[styles.resultCard, isTop && styles.resultCardTop]}>
      {isTop && (
        <LinearGradient
          colors={[Colors.dark.accentGlow, 'transparent']}
          style={styles.topGlow}
        />
      )}

      <View style={styles.resultHeader}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankEmoji}>{index < 3 ? rankEmojis[index] : `#${index + 1}`}</Text>
        </View>

        <View style={styles.resultInfo}>
          <Text style={styles.resultCardName}>{result.card.name}</Text>
          <Text style={styles.resultIssuer}>{result.card.issuer}</Text>
        </View>

        <View style={styles.returnBadge}>
          <Text style={[styles.returnAmount, isTop && styles.returnAmountTop]}>
            {result.rewardType === 'cashback' && !result.displayAmount.startsWith('$')
              ? `$${result.displayAmount}`
              : result.displayAmount}
          </Text>
          <Text style={styles.returnLabel}>{result.displayUnit}</Text>
        </View>
      </View>

      <View style={styles.barContainer}>
        <Animated.View
          style={[
            styles.bar,
            isTop && styles.barTop,
            {
              width: barWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <View style={styles.resultFooter}>
        <View style={styles.rewardTypeBadge}>
          <Text style={styles.rewardTypeText}>{getRewardTypeLabel(result.rewardType)}</Text>
        </View>
      </View>

      <Text style={styles.calculationBreakdown} testID={`calculation-breakdown-${result.card.id}`}>
        {calcBreakdown}
      </Text>

      {result.portalOnly ? (
        <View style={styles.portalBadge}>
          <Globe size={11} color="#F59E0B" />
          <Text style={styles.portalBadgeText}>Rate available only via {result.portalOnly}</Text>
        </View>
      ) : null}

      {result.caveat ? (
        <View style={styles.caveatBadge}>
          <AlertTriangle size={11} color="#FB923C" style={{ marginTop: 1 }} />
          <Text style={styles.caveatText}>{result.caveat}</Text>
        </View>
      ) : null}

      {result.biltRentDayBoost ? (
        <View style={styles.biltBoostBadge}>
          <Zap size={11} color="#22D3EE" fill="#22D3EE" />
          <Text style={styles.biltBoostText}>Rent Day 2x boost applied</Text>
        </View>
      ) : null}

      {result.bonusCategoryBoost && !result.firstYearBoost ? (
        <View style={styles.bonusCategoryBadge}>
          <Zap size={11} color="#E31837" fill="#E31837" />
          <Text style={styles.bonusCategoryText}>
            {result.rewardType === 'cashback'
              ? `${result.rewardRate}% chosen bonus category applied`
              : `${result.rewardRate}x chosen bonus category applied`}
          </Text>
        </View>
      ) : null}

      {result.firstYearBoost ? (
        <View style={styles.firstYearBoostBadge}>
          <Zap size={11} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.firstYearBoostText}>
            {result.rewardType === 'cashback'
              ? `First-year bonus: ${result.rewardRate}% applied`
              : `First-year bonus: ${result.rewardRate}x applied`}
          </Text>
        </View>
      ) : null}

      {isTop && index < 3 && (
        <View style={styles.topBadge}>
          <Trophy size={10} color={Colors.dark.accent} />
          <Text style={styles.topBadgeText}>{rankLabels[index]}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 28,
  },
  categoryEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
    letterSpacing: -0.3,
  },
  headerAmount: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  resultsList: {
    gap: 12,
  },
  resultCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  resultCardTop: {
    borderColor: Colors.dark.accent,
    backgroundColor: Colors.dark.accentMuted,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankEmoji: {
    fontSize: 18,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  resultIssuer: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 1,
  },
  returnBadge: {
    alignItems: 'flex-end',
  },
  returnAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  returnAmountTop: {
    color: Colors.dark.accent,
  },
  returnLabel: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    marginTop: 1,
  },
  barContainer: {
    height: 6,
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: Colors.dark.textSecondary,
    borderRadius: 3,
  },
  barTop: {
    backgroundColor: Colors.dark.accent,
  },
  resultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardTypeBadge: {
    backgroundColor: Colors.dark.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rewardTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  calculationBreakdown: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 17,
  },
  explanation: {
    flex: 1,
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 16,
  },
  rankingNote: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    marginTop: 8,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    top: 8,
    right: 12,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.dark.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 4,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: Colors.dark.textTertiary,
    lineHeight: 16,
  },
  portalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  portalBadgeText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '500',
  },
  caveatBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(251, 146, 60, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.18)',
  },
  caveatText: {
    flex: 1,
    fontSize: 11,
    color: '#FB923C',
    fontWeight: '500',
    lineHeight: 15,
  },
  rentDayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  rentDayBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22D3EE',
  },
  biltBoostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.18)',
  },
  biltBoostText: {
    fontSize: 11,
    color: '#22D3EE',
    fontWeight: '600',
  },
  bonusCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    backgroundColor: 'rgba(227, 24, 55, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(227, 24, 55, 0.18)',
  },
  bonusCategoryText: {
    fontSize: 11,
    color: '#E31837',
    fontWeight: '600',
  },
  firstYearBoostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.18)',
  },
  firstYearBoostText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },
});
