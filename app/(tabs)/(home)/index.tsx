import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  UtensilsCrossed,
  ShoppingCart,
  Fuel,
  Plane,
  Car,
  ShoppingBag,
  Pill,
  Tv,
  CreditCard,
} from 'lucide-react-native';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useCardWise } from '@/providers/CardWiseProvider';
import { Category, CategoryInfo } from '@/types';
import { useResponsive } from '@/hooks/useResponsive';

const categoryIcons: Record<Category, React.ReactNode> = {
  restaurant: <UtensilsCrossed size={26} color={Colors.dark.accent} />,
  grocery: <ShoppingCart size={26} color="#30D158" />,
  gas: <Fuel size={26} color="#FF9F0A" />,
  travel: <Plane size={26} color="#3478F6" />,
  transport: <Car size={26} color="#64D2FF" />,
  onlineShopping: <ShoppingBag size={26} color="#BF5AF2" />,
  pharmacy: <Pill size={26} color="#FF375F" />,
  streaming: <Tv size={26} color="#FF6482" />,
  other: <CreditCard size={26} color={Colors.dark.textSecondary} />,
};

const categoryColors: Record<Category, string> = {
  restaurant: 'rgba(212, 168, 83, 0.1)',
  grocery: 'rgba(48, 209, 88, 0.1)',
  gas: 'rgba(255, 159, 10, 0.1)',
  travel: 'rgba(52, 120, 246, 0.1)',
  transport: 'rgba(100, 210, 255, 0.1)',
  onlineShopping: 'rgba(191, 90, 242, 0.1)',
  pharmacy: 'rgba(255, 55, 95, 0.1)',
  streaming: 'rgba(255, 100, 130, 0.1)',
  other: 'rgba(94, 94, 114, 0.1)',
};

export default function HomeScreen() {
  const router = useRouter();
  const { selectedCards, settings } = useCardWise();
  const { contentPadding, contentWidth, gridColumns } = useResponsive();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState<string>(settings.defaultPurchaseAmount.toString());
  const buttonAnims = useRef(
    Object.keys(CategoryInfo).reduce((acc, key) => {
      acc[key] = new Animated.Value(1);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  const handleCategoryPress = useCallback(
    (category: Category) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const anim = buttonAnims[category];
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start(() => {
        const purchaseAmount = parseFloat(amount) || settings.defaultPurchaseAmount;
        router.push({
          pathname: '/results',
          params: { category, amount: purchaseAmount.toString() },
        });
      });
    },
    [amount, settings.defaultPurchaseAmount, router, buttonAnims]
  );

  const categories = Object.keys(CategoryInfo) as Category[];

  const gridGap = 10;
  const gridItemWidth = useMemo(() => {
    const availableWidth = contentWidth - 40;
    return (availableWidth - gridGap * (gridColumns - 1)) / gridColumns;
  }, [contentWidth, gridColumns]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#0A0A0F', '#10101A', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: contentPadding, paddingTop: insets.top + (Platform.OS === 'web' ? 24 : 12) },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.logoCenter}>
              <Image
                source={require('@/assets/images/perkcalc-logo-transparent.png')}
                style={styles.headerLogoCentered}
              />
            </View>
            <Text style={styles.greeting}>Where are you buying?</Text>
            <Text style={styles.subGreeting}>
              {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''} in wallet
            </Text>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Purchase amount</Text>
            <View style={styles.amountInputWrap}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="50"
                placeholderTextColor={Colors.dark.textTertiary}
                testID="amount-input"
              />
            </View>
          </View>

          <View style={styles.grid}>
            {categories.map((cat, index) => {
              const isLastRow = index >= categories.length - (categories.length % gridColumns || gridColumns);
              const lastRowCount = categories.length % gridColumns || gridColumns;
              const needsCentering = isLastRow && lastRowCount < gridColumns;
              const marginLeft = needsCentering && index === categories.length - lastRowCount
                ? ((gridColumns - lastRowCount) * (gridItemWidth + gridGap)) / 2
                : 0;
              return (
              <Animated.View
                key={cat}
                style={[
                  { width: gridItemWidth },
                  { transform: [{ scale: buttonAnims[cat] }] },
                  marginLeft > 0 ? { marginLeft } : undefined,
                ]}
              >
                <Pressable
                  onPress={() => handleCategoryPress(cat)}
                  style={styles.gridItem}
                  testID={`category-${cat}`}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: categoryColors[cat] },
                    ]}
                  >
                    {categoryIcons[cat]}
                  </View>
                  <Text style={styles.gridLabel}>
                    {CategoryInfo[cat].label}
                  </Text>
                </Pressable>
              </Animated.View>
            );
            })}
          </View>

          {selectedCards.length === 0 && (
            <View style={styles.emptyBanner}>
              <CreditCard size={20} color={Colors.dark.accent} />
              <Text style={styles.emptyText}>
                Add cards to your wallet to get recommendations
              </Text>
            </View>
          )}

          <View style={styles.disclaimer} testID="home-security-disclaimer">
            <Text style={styles.disclaimerText}>
              For informational purposes only. PerkCalc is not affiliated with or endorsed by any financial institution. Reward rates may change and should be confirmed with the official issuer.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  logoCenter: {
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  headerLogoCentered: {
    width: 180,
    height: 112,
  },
  greeting: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    letterSpacing: -0.5,
    textAlign: 'center' as const,
  },
  subGreeting: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  amountContainer: {
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  amountInputWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 16,
    height: 52,
  },
  dollarSign: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    padding: 0,
  },
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  gridItem: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.dark.textSecondary,
    textAlign: 'center' as const,
  },
  emptyBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.accentMuted,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    gap: 10,
  },
  emptyText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark.accentLight,
    lineHeight: 18,
  },
  disclaimer: {
    marginTop: 18,
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
