import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FastCoachFonts, FastCoachPalette, type ColorSchemeName } from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
import { DIET_OPTIONS } from '@/src/constants/diets';
import type { DietPreferenceId } from '@/src/domain/types';
import { useAppStore } from '@/src/store/useAppStore';

type DietIcon = 'silverware-fork-knife' | 'egg-outline' | 'leaf' | 'sprout' | 'fish';

const DIET_ICONS: Record<DietPreferenceId, DietIcon> = {
  omnivore: 'silverware-fork-knife',
  vegan: 'sprout',
  vegetarian: 'leaf',
  pescatarian: 'fish',
  meat_forward: 'egg-outline',
};

const DIET_ACCENT: Record<DietPreferenceId, 'primary' | 'secondary' | 'tertiary'> = {
  omnivore: 'primary',
  vegan: 'primary',
  vegetarian: 'primary',
  pescatarian: 'secondary',
  meat_forward: 'tertiary',
};

export default function OnboardingScreen() {
  const scheme = (useColorScheme() === 'dark' ? 'dark' : 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const skipOnboarding = useAppStore((s) => s.skipOnboarding);
  const [selectedDiet, setSelectedDiet] = useState<DietPreferenceId>(
    () => useAppStore.getState().dietPreferenceId ?? 'omnivore',
  );

  const heroIcon = useMemo<DietIcon>(() => DIET_ICONS[selectedDiet], [selectedDiet]);

  function tone(id: DietPreferenceId): string {
    const accent = DIET_ACCENT[id];
    if (accent === 'secondary') return palette.secondary;
    if (accent === 'tertiary') return palette.tertiary;
    return palette.primary;
  }
  function toneBg(id: DietPreferenceId): string {
    return `${tone(id)}1A`;
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
    <ScreenBackground palette={palette} accent="onboarding">
      <SafeAreaView edges={['top']} style={styles.flex}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={[styles.brandOrb, { backgroundColor: palette.primaryContainer }]}>
              <MaterialCommunityIcons name="timer-sand" size={18} color={palette.onPrimaryContainer} />
            </View>
            <Text style={[styles.brandLabel, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
              Fast Coach
            </Text>
          </View>
          <Pressable onPress={skip} accessibilityRole="button" accessibilityLabel="Skip onboarding" hitSlop={10}>
            <Text style={[styles.skipTop, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.label }]}>
              SKIP
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 160 }]}
          showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.heroWrap}>
            <View style={[styles.heroIconWrap, { backgroundColor: palette.primaryContainer }]}>
              <MaterialCommunityIcons name={heroIcon} size={36} color={palette.onPrimaryContainer} />
            </View>
            <Text style={[styles.heroTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.display }]}>
              Tailored for you.
            </Text>
            <Text style={[styles.heroSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
              How do you usually eat? This helps us personalize your meal suggestions and fasting phases.
            </Text>
          </View>

          {/* Selection — primary "Everything" then a 2x2 bento */}
          <View style={{ gap: 12 }}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedDiet === 'omnivore' }}
              onPress={() => setSelectedDiet('omnivore')}>
              <GlassCard
                palette={palette}
                radius={20}
                tone={selectedDiet === 'omnivore' ? 'high' : 'mid'}
                style={[
                  styles.heroDiet,
                  {
                    borderColor: selectedDiet === 'omnivore' ? palette.primary : palette.glassBorder,
                    borderWidth: selectedDiet === 'omnivore' ? 1.8 : StyleSheet.hairlineWidth,
                  },
                ]}>
                <View style={[styles.dietOrb, { backgroundColor: toneBg('omnivore') }]}>
                  <MaterialCommunityIcons name={DIET_ICONS.omnivore} size={22} color={tone('omnivore')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dietTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
                    Everything
                  </Text>
                  <Text style={[styles.dietSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                    A mix of animal and plant foods, no specific dietary restrictions.
                  </Text>
                </View>
                {selectedDiet === 'omnivore' ? (
                  <MaterialCommunityIcons name="check-circle" size={24} color={palette.primary} />
                ) : null}
              </GlassCard>
            </Pressable>

            <View style={styles.gridRow}>
              {DIET_OPTIONS.filter((o) => o.id !== 'omnivore').map((opt) => {
                const sel = selectedDiet === opt.id;
                const accent = tone(opt.id);
                return (
                  <Pressable
                    key={opt.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: sel }}
                    accessibilityLabel={`${opt.label}: ${opt.description}`}
                    onPress={() => setSelectedDiet(opt.id)}
                    style={styles.gridCell}>
                    <GlassCard
                      palette={palette}
                      radius={20}
                      tone={sel ? 'high' : 'mid'}
                      style={[
                        styles.gridCard,
                        {
                          borderColor: sel ? accent : palette.glassBorder,
                          borderWidth: sel ? 1.8 : StyleSheet.hairlineWidth,
                        },
                      ]}>
                      <View style={[styles.dietOrb, { backgroundColor: toneBg(opt.id) }]}>
                        <MaterialCommunityIcons name={DIET_ICONS[opt.id]} size={22} color={accent} />
                      </View>
                      <Text
                        style={[styles.gridTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
                        {opt.label}
                      </Text>
                    </GlassCard>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Coach Insight callout */}
          <GlassCard
            palette={palette}
            radius={18}
            tone="mid"
            style={[styles.insight, { borderLeftColor: palette.primary }]}>
            <MaterialCommunityIcons name="check-decagram" color={palette.primary} size={22} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.insightEyebrow, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
                COACH INSIGHT
              </Text>
              <Text style={[styles.insightBody, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                Selecting a diet profile helps us align your meal suggestions with what you actually eat. You can change this anytime in Settings.
              </Text>
            </View>
          </GlassCard>
        </ScrollView>

        {/* Fixed bottom action */}
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: Math.max(insets.bottom + 8, 18),
              borderTopColor: palette.glassBorder,
            },
          ]}>
          <BlurView
            intensity={Platform.select({ ios: 40, android: 22, web: 0 })}
            tint={scheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: scheme === 'dark' ? 'rgba(26,28,31,0.82)' : 'rgba(249,249,254,0.82)' },
            ]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with selected diet"
            onPress={continueOnboarding}
            style={({ pressed }) => [
              styles.continueBtn,
              { backgroundColor: palette.primary, shadowColor: palette.primaryFixedDim, opacity: pressed ? 0.92 : 1 },
            ]}>
            <Text style={[styles.continueText, { color: palette.onPrimary, fontFamily: FastCoachFonts.headlineMd }]}>
              Continue
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={palette.onPrimary} />
          </Pressable>
          <Text style={[styles.step, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.label }]}>
            STEP 1 OF 1 · DIETARY PROFILE
          </Text>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandOrb: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLabel: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  skipTop: { fontSize: 11, letterSpacing: 1.4, fontWeight: '800' },
  scroll: { paddingHorizontal: 22, paddingTop: 8, gap: 18 },
  heroWrap: { alignItems: 'center', marginBottom: 8, gap: 10 },
  heroIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  heroTitle: { fontSize: 36, lineHeight: 40, textAlign: 'center', fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 340 },
  heroDiet: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dietOrb: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dietTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  dietSub: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCell: { flexBasis: '47%', flexGrow: 1 },
  gridCard: { padding: 16, gap: 10, minHeight: 110 },
  gridTitle: { fontSize: 16, fontWeight: '700' },
  insight: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderLeftWidth: 4,
    alignItems: 'flex-start',
    marginTop: 4,
  },
  insightEyebrow: { fontSize: 11, letterSpacing: 1.6, fontWeight: '800' },
  insightBody: { fontSize: 13, lineHeight: 19 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 14,
    gap: 8,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  continueBtn: {
    width: '100%',
    height: 56,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  continueText: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  step: { fontSize: 10, letterSpacing: 1.4, fontWeight: '800' },
});
