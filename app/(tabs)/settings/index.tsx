import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DollarSign,
  Coins,
  Plane,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react-native';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCardWise } from '@/providers/CardWiseProvider';
import { useResponsive } from '@/hooks/useResponsive';

export default function SettingsScreen() {
  const { settings, updateSettings } = useCardWise();
  const { contentPadding, windowWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  const [pointValue, setPointValue] = useState<string>(
    (settings.pointValue * 100).toFixed(1)
  );
  const [mileValue, setMileValue] = useState<string>(
    (settings.mileValue * 100).toFixed(1)
  );
  const [defaultAmount, setDefaultAmount] = useState<string>(
    settings.defaultPurchaseAmount.toString()
  );

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateSettings({
      pointValue: parseFloat(pointValue) / 100 || 0.015,
      mileValue: parseFloat(mileValue) / 100 || 0.012,
      defaultPurchaseAmount: parseFloat(defaultAmount) || 50,
    });
    Alert.alert('Saved', 'Your settings have been updated.');
  };

  const handleReset = () => {
    Alert.alert('Reset Settings', 'Restore default values?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setPointValue('1.5');
          setMileValue('1.2');
          setDefaultAmount('50');
          updateSettings({
            pointValue: 0.015,
            mileValue: 0.012,
            defaultPurchaseAmount: 50,
          });
        },
      },
    ]);
  };

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
              style={[
                styles.headerLogo,
                windowWidth < 390 ? styles.headerLogoCompact : null,
              ]}
            />
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>Customize reward calculations</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Point & Mile Values</Text>
          <Text style={styles.sectionDesc}>
            Set your cents-per-point and cents-per-mile values so rankings
            reflect your redemption value.
          </Text>
          <View style={styles.methodCard} testID="comparison-method-note">
            <Text style={styles.methodTitle}>How ranking works</Text>
            <Text style={styles.methodText}>
              We convert every reward into estimated dollars before ranking.
              Cashback stays in dollars. Points use your point value, and miles
              use your mile value (example: 1 point = 1.5¢, 1 mile = 1.2¢).
            </Text>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputIcon}>
              <Coins size={18} color={Colors.dark.accent} />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Point value</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={pointValue}
                  onChangeText={setPointValue}
                  keyboardType="decimal-pad"
                  placeholder="1.5"
                  placeholderTextColor={Colors.dark.textTertiary}
                  testID="point-value-input"
                />
                <Text style={styles.inputSuffix}>¢ per point</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputIcon}>
              <Plane size={18} color={Colors.dark.cardBlue} />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Mile value</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={mileValue}
                  onChangeText={setMileValue}
                  keyboardType="decimal-pad"
                  placeholder="1.2"
                  placeholderTextColor={Colors.dark.textTertiary}
                  testID="mile-value-input"
                />
                <Text style={styles.inputSuffix}>¢ per mile</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Defaults</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputIcon}>
              <DollarSign size={18} color={Colors.dark.success} />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Default purchase amount</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.dollarPrefix}>$</Text>
                <TextInput
                  style={styles.input}
                  value={defaultAmount}
                  onChangeText={setDefaultAmount}
                  keyboardType="decimal-pad"
                  placeholder="50"
                  placeholderTextColor={Colors.dark.textTertiary}
                  testID="default-amount-input"
                />
              </View>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          style={styles.saveButton}
          testID="save-settings"
        >
          <LinearGradient
            colors={[Colors.dark.accent, Colors.dark.accentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveGradient}
          >
            <Text style={styles.saveText}>Save Settings</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={handleReset}
          style={styles.resetButton}
          testID="reset-settings"
        >
          <RotateCcw size={16} color={Colors.dark.textSecondary} />
          <Text style={styles.resetText}>Reset to Defaults</Text>
        </Pressable>

        <View style={styles.infoSection}>
          <ShieldCheck size={20} color={Colors.dark.success} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>100% Private</Text>
            <Text style={styles.infoDesc}>
              All data is stored locally on your device. No accounts, no
              tracking, no data collection.
            </Text>
          </View>
        </View>

        <Text style={styles.disclaimerText} testID="settings-disclaimer">
          For informational purposes only. PerkCalc is not affiliated with or
          endorsed by any financial institution. Reward rates may change and
          should be confirmed with the official issuer.
        </Text>
      </ScrollView>
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
    paddingBottom: 24,
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
  headerLogoCompact: {
    width: 138,
    height: 86,
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
    flexShrink: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  methodCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    padding: 12,
    marginBottom: 10,
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  methodText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 17,
  },
  inputRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceHighlight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  inputContent: {
    flex: 1,
    marginLeft: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  dollarPrefix: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
    marginRight: 2,
  },
  input: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    padding: 0,
    minWidth: 50,
  },
  inputSuffix: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginLeft: 4,
  },
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden' as const,
    marginBottom: 12,
  },
  saveGradient: {
    paddingVertical: 16,
    alignItems: 'center' as const,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  resetButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    marginBottom: 28,
  },
  resetText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
  },
  infoSection: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.dark.successMuted,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.success,
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 17,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    lineHeight: 16,
    marginTop: 14,
    marginBottom: 8,
  },
});
