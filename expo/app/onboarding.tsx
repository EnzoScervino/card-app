import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, CreditCard } from 'lucide-react-native';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCardWise } from '@/providers/CardWiseProvider';
import { defaultCards } from '@/mocks/cards';
import { useResponsive } from '@/hooks/useResponsive';

export default function OnboardingScreen() {
  const { toggleCard, selectedCardIds, completeOnboarding } = useCardWise();
  const { contentPadding } = useResponsive();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const cardAnims = useRef(defaultCards.map(() => new Animated.Value(0))).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    defaultCards.forEach((_, i) => {
      Animated.timing(cardAnims[i], {
        toValue: 1,
        duration: 400,
        delay: 600 + i * 60,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleToggle = (cardId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleCard(cardId);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      completeOnboarding();
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0F', '#12121E', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: contentPadding },
          ]}
        >
          <Animated.View
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Image
              source={require('@/assets/images/perkcalc-logo-transparent.png')}
              style={styles.logoImage}
            />
            <Text style={styles.title}>PerkCalc</Text>
            <Text style={styles.subtitle}>
              Select the cards in your wallet.{'\n'}We'll tell you the best one to use.
            </Text>
          </Animated.View>

          <View style={styles.cardsContainer}>
            {defaultCards.map((card, index) => {
              const isSelected = selectedCardIds.includes(card.id);
              return (
                <Animated.View
                  key={card.id}
                  style={{
                    opacity: cardAnims[index],
                    transform: [
                      {
                        translateY: cardAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <Pressable
                    onPress={() => handleToggle(card.id)}
                    style={[
                      styles.cardItem,
                      isSelected && styles.cardItemSelected,
                    ]}
                    testID={`onboarding-card-${card.id}`}
                  >
                    <View
                      style={[
                        styles.cardChip,
                        { backgroundColor: card.color },
                      ]}
                    >
                      <CreditCard size={14} color="#FFF" />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{card.name}</Text>
                      <Text style={styles.cardIssuer}>{card.issuer}</Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <View style={styles.checkboxInner} />
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingHorizontal: contentPadding }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              onPress={handleContinue}
              style={[
                styles.continueButton,
                selectedCardIds.length === 0 && styles.continueButtonDisabled,
              ]}
              disabled={selectedCardIds.length === 0}
              testID="onboarding-continue"
            >
              <LinearGradient
                colors={
                  selectedCardIds.length > 0
                    ? [Colors.dark.accent, Colors.dark.accentDark]
                    : [Colors.dark.surfaceHighlight, Colors.dark.surfaceElevated]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueGradient}
              >
                <Text
                  style={[
                    styles.continueText,
                    selectedCardIds.length === 0 && styles.continueTextDisabled,
                  ]}
                >
                  Get Started
                </Text>
                <ArrowRight
                  size={18}
                  color={
                    selectedCardIds.length > 0 ? '#FFF' : Colors.dark.textTertiary
                  }
                />
              </LinearGradient>
            </Pressable>
          </Animated.View>
          <Text style={styles.footerHint}>
            {selectedCardIds.length} card{selectedCardIds.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center' as const,
    paddingTop: 24,
    paddingBottom: 28,
  },
  logoImage: {
    width: 220,
    height: 140,
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 8,
  },
  cardItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cardItemSelected: {
    borderColor: Colors.dark.accent,
    backgroundColor: Colors.dark.accentMuted,
  },
  cardChip: {
    width: 36,
    height: 24,
    borderRadius: 6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  cardIssuer: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkboxSelected: {
    borderColor: Colors.dark.accent,
    backgroundColor: Colors.dark.accent,
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  footer: {
    paddingBottom: 8,
    paddingTop: 12,
  },
  continueButton: {
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    gap: 8,
  },
  continueText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  continueTextDisabled: {
    color: Colors.dark.textTertiary,
  },
  footerHint: {
    textAlign: 'center' as const,
    color: Colors.dark.textTertiary,
    fontSize: 13,
    marginTop: 10,
  },
});
