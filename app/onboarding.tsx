import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FastCoachFonts, FastCoachPalette, type ColorSchemeName } from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { ScalePressable } from '@/src/components/fastCoach/ScalePressable';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
import { DIET_OPTIONS } from '@/src/constants/diets';
import type { DietPreferenceId } from '@/src/domain/types';
import { useAppStore } from '@/src/store/useAppStore';

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const scheme = (colorScheme === 'dark' ? 'dark' : 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const skipOnboarding = useAppStore((s) => s.skipOnboarding);
  const [selectedDiet, setSelectedDiet] = useState<DietPreferenceId>('omnivore');

  const heroIcon = useMemo(() => {
    if (selectedDiet === 'vegan' || selectedDiet === 'vegetarian') return 'leaf';
    if (selectedDiet === 'pescatarian') return 'anchor';
    if (selectedDiet === 'meat_forward') return 'cutlery';
    return 'spoon';
  }, [selectedDiet]);

  function choose(pref: DietPreferenceId) {
    setSelectedDiet(pref);
  }

  function continueOnboarding() {
    completeOnboarding(selectedDiet);
    router.replace('/');
  }

  function skip() {
    skipOnboarding();
    router.replace('/');
  }

  return (
    <ScreenBackground palette={palette}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <FontAwesome name="leaf" size={18} color={palette.primary} />
            <Text style={[styles.brandLabel, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
              Fasting Tracker
            </Text>
          </View>
          <Pressable onPress={skip} accessibilityRole="button" accessibilityLabel="Skip onboarding">
            <Text style={[styles.skipTop, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.label }]}>
              Skip
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.heroWrap}>
            <View style={[styles.heroIconWrap, { backgroundColor: palette.primaryFixed }]}>
              <FontAwesome name={heroIcon} size={32} color={palette.onPrimaryContainer} />
            </View>
            <Text style={[styles.title, { color: palette.onSurface, fontFamily: FastCoachFonts.display }]}>
              Tailored for you.
            </Text>
            <Text style={[styles.sub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
              How do you usually eat? This helps us personalize your meal suggestions and fasting phases.
            </Text>
          </View>

          <View style={styles.list}>
            {DIET_OPTIONS.map((opt) => {
              const selected = selectedDiet === opt.id;
              return (
                <ScalePressable
                  key={opt.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${opt.label}: ${opt.description}`}
                  onPress={() => choose(opt.id)}
                  scaleTo={0.985}>
                  <GlassCard
                    palette={palette}
                    style={[
                      styles.optionCard,
                      { borderColor: selected ? palette.primary : palette.glassBorder },
                      selected && styles.optionCardSelected,
                    ]}>
                    <View style={[styles.optionIcon, { backgroundColor: selected ? palette.primaryContainer : palette.surfaceContainerLow }]}>
                      <FontAwesome name="cutlery" size={16} color={selected ? palette.onPrimaryContainer : palette.onSurfaceVariant} />
                    </View>
                    <View style={styles.optionText}>
                      <Text style={[styles.optTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.optSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                        {opt.description}
                      </Text>
                    </View>
                    {selected ? <FontAwesome name="check-circle" size={20} color={palette.primary} /> : null}
                  </GlassCard>
                </ScalePressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { borderTopColor: palette.glassBorder, backgroundColor: palette.glassFill }]}>
          <ScalePressable
            onPress={continueOnboarding}
            accessibilityRole="button"
            accessibilityLabel="Continue onboarding"
            scaleTo={0.985}>
            <View style={[styles.continueBtn, { backgroundColor: palette.primary }]}>
            <Text style={[styles.continueLabel, { color: palette.onPrimary, fontFamily: FastCoachFonts.headlineMd }]}>
              Continue
            </Text>
            <FontAwesome name="arrow-right" size={14} color={palette.onPrimary} />
            </View>
          </ScalePressable>
          <Text style={[styles.step, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.label }]}>
            Step 2 of 4 · Dietary Profile
          </Text>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLabel: { fontSize: 20 },
  skipTop: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  scroll: {
    padding: 24,
    paddingBottom: 140,
  },
  heroWrap: { alignItems: 'center', marginBottom: 24 },
  heroIconWrap: {
    width: 92,
    height: 92,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 42, lineHeight: 46, textAlign: 'center' },
  sub: {
    marginTop: 6,
    fontSize: 17,
    lineHeight: 27,
    textAlign: 'center',
  },
  list: { gap: 12 },
  optionCard: {
    minHeight: 86,
    borderWidth: 1.2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionCardSelected: { shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  optionIcon: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1 },
  optTitle: { fontSize: 18, lineHeight: 22 },
  optSub: { marginTop: 2, fontSize: 13, lineHeight: 19 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 18,
    alignItems: 'center',
    gap: 8,
  },
  continueBtn: {
    borderRadius: 999,
    width: '100%',
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueLabel: { fontSize: 18 },
  step: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7 },
});
