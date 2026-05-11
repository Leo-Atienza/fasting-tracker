import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FastCoachFonts,
  FastCoachPalette,
  type ColorSchemeName,
  type FastCoachPalette as CoachPaletteColors,
} from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { IOSToggle } from '@/src/components/fastCoach/IOSToggle';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
import { DIET_OPTIONS } from '@/src/constants/diets';
import type { DietPreferenceId } from '@/src/domain/types';
import { ensureNotificationsPermission } from '@/src/features/notifications/scheduler';
import {
  ONBOARDING_STEPS,
  advanceStep,
  backStep,
  buildOnboardingPayload,
  currentStepId,
  initialOnboardingState,
  isLastStep as isLastStepFn,
} from '@/src/features/onboarding/state';
import { useAppStore } from '@/src/store/useAppStore';

const FAST_GOAL_OPTIONS: { minutes: number | null; label: string; sub: string; icon: 'weather-sunset-up' | 'chart-timeline-variant' | 'fire' | 'recycle' | 'infinity' }[] = [
  { minutes: 12 * 60, label: '12 hours', sub: 'Gentle — overnight + a little extra.', icon: 'weather-sunset-up' },
  { minutes: 14 * 60, label: '14 hours', sub: 'A modest stretch beyond breakfast.', icon: 'chart-timeline-variant' },
  { minutes: 16 * 60, label: '16 hours', sub: 'The classic 16:8 window.', icon: 'fire' },
  { minutes: 18 * 60, label: '18 hours', sub: 'A deeper glide for steadier days.', icon: 'recycle' },
  { minutes: 24 * 60, label: '24 hours', sub: 'One-meal-a-day territory.', icon: 'recycle' },
  { minutes: null, label: 'Open', sub: 'No countdown — finish when you like.', icon: 'infinity' },
];

const WATER_GOAL_OPTIONS: { ml: number; label: string; sub: string }[] = [
  { ml: 2000, label: '2.0 L', sub: 'Light · about 8 cups' },
  { ml: 2500, label: '2.5 L', sub: 'Standard · about 10 cups' },
  { ml: 3000, label: '3.0 L', sub: 'Active · about 12 cups' },
  { ml: 3500, label: '3.5 L', sub: 'Athlete · about 14 cups' },
];

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

  const [state, setState] = useState(() =>
    initialOnboardingState({
      defaultFastTargetMinutes: useAppStore.getState().defaultFastTargetMinutes,
      dietPreferenceId: useAppStore.getState().dietPreferenceId,
      waterDailyGoalMl: useAppStore.getState().waterDailyGoalMl,
      fastingRemindersEnabled: useAppStore.getState().fastingRemindersEnabled,
    }),
  );
  const [working, setWorking] = useState(false);

  const stepIndex = state.stepIndex;
  const fastingTargetMinutes = state.fastingTargetMinutes;
  const selectedDiet = state.selectedDiet;
  const waterGoalMl = state.waterGoalMl;
  const remindersOn = state.remindersOn;
  const currentStep = ONBOARDING_STEPS[stepIndex]!;
  const isLastStep = isLastStepFn(state);
  const currentId = currentStepId(state);

  const setFastingTargetMinutes = (v: number | null) =>
    setState((s) => ({ ...s, fastingTargetMinutes: v }));
  const setSelectedDiet = (v: DietPreferenceId) =>
    setState((s) => ({ ...s, selectedDiet: v }));
  const setWaterGoalMl = (v: number) => setState((s) => ({ ...s, waterGoalMl: v }));
  const setRemindersOn = (v: boolean) => setState((s) => ({ ...s, remindersOn: v }));

  function back() {
    setState((s) => backStep(s));
  }

  async function next() {
    if (working) return;
    if (!isLastStep) {
      setState((s) => advanceStep(s));
      return;
    }
    setWorking(true);
    try {
      // If reminders were chosen, attempt to obtain OS permission. We still
      // persist the user's preference either way — they can re-enable later.
      let permissionGranted = true;
      if (remindersOn) {
        permissionGranted = await ensureNotificationsPermission();
        if (!permissionGranted) {
          Alert.alert(
            'Notifications are blocked',
            'You can enable reminders any time from Settings once the OS permission is granted.',
          );
        }
      }
      completeOnboarding(buildOnboardingPayload(state, permissionGranted));
      router.replace('/');
    } finally {
      setWorking(false);
    }
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
              Fasting Tracker
            </Text>
          </View>
          <Pressable onPress={skip} accessibilityRole="button" accessibilityLabel="Skip onboarding" hitSlop={10}>
            <Text style={[styles.skipTop, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.label }]}>
              SKIP
            </Text>
          </Pressable>
        </View>

        {/* Progress bar */}
        <View style={styles.progressRow}>
          {ONBOARDING_STEPS.map((s, i) => (
            <View
              key={s.id}
              style={[
                styles.progressDot,
                {
                  backgroundColor: i <= stepIndex ? palette.primary : `${palette.outlineVariant}99`,
                  flex: 1,
                },
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 180 }]}
          showsVerticalScrollIndicator={false}>
          {currentId === 'fasting' ? (
            <FastingStep
              palette={palette}
              selected={fastingTargetMinutes}
              onSelect={setFastingTargetMinutes}
            />
          ) : currentId === 'diet' ? (
            <DietStep palette={palette} selected={selectedDiet} onSelect={setSelectedDiet} />
          ) : currentId === 'water' ? (
            <WaterStep palette={palette} selected={waterGoalMl} onSelect={setWaterGoalMl} />
          ) : (
            <RemindersStep palette={palette} value={remindersOn} onChange={setRemindersOn} />
          )}
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
          <View style={styles.bottomRow}>
            {stepIndex > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back to previous step"
                onPress={back}
                style={({ pressed }) => [
                  styles.backBtn,
                  {
                    borderColor: palette.outlineVariant,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <MaterialCommunityIcons name="arrow-left" size={20} color={palette.onSurface} />
              </Pressable>
            ) : (
              <View style={styles.backBtnPlaceholder} />
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isLastStep ? 'Finish onboarding' : 'Continue to next step'}
              onPress={next}
              disabled={working}
              style={({ pressed }) => [
                styles.continueBtn,
                {
                  backgroundColor: palette.primary,
                  shadowColor: palette.primaryFixedDim,
                  opacity: working ? 0.7 : pressed ? 0.92 : 1,
                },
              ]}>
              <Text style={[styles.continueText, { color: palette.onPrimary, fontFamily: FastCoachFonts.headlineMd }]}>
                {isLastStep ? 'Get Started' : 'Continue'}
              </Text>
              <MaterialCommunityIcons
                name={isLastStep ? 'check' : 'arrow-right'}
                size={18}
                color={palette.onPrimary}
              />
            </Pressable>
          </View>
          <Text style={[styles.step, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.label }]}>
            {`STEP ${stepIndex + 1} OF ${ONBOARDING_STEPS.length} · ${currentStep.label.toUpperCase()}`}
          </Text>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

// ─── Step 1: Fasting Goal ──────────────────────────────────────────────────

function FastingStep({
  palette,
  selected,
  onSelect,
}: {
  palette: CoachPaletteColors;
  selected: number | null;
  onSelect: (m: number | null) => void;
}) {
  return (
    <>
      <View style={styles.heroWrap}>
        <View style={[styles.heroIconWrap, { backgroundColor: palette.primaryContainer }]}>
          <MaterialCommunityIcons name="timer-sand" size={36} color={palette.onPrimaryContainer} />
        </View>
        <Text style={[styles.heroTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.display }]}>
          Pick your goal.
        </Text>
        <Text style={[styles.heroSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
          We'll pre-select this when you tap Begin Fast. Change it anytime — it's a starting point, not a contract.
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {FAST_GOAL_OPTIONS.map((opt) => {
          const sel = selected === opt.minutes;
          return (
            <Pressable
              key={String(opt.minutes ?? 'open')}
              accessibilityRole="radio"
              accessibilityState={{ checked: sel }}
              accessibilityLabel={`${opt.label} fasting goal — ${opt.sub}`}
              onPress={() => onSelect(opt.minutes)}>
              <GlassCard
                palette={palette}
                radius={20}
                tone={sel ? 'high' : 'mid'}
                style={[
                  styles.optionRow,
                  {
                    borderColor: sel ? palette.primary : palette.glassBorder,
                    borderWidth: sel ? 1.8 : StyleSheet.hairlineWidth,
                  },
                ]}>
                <View style={[styles.optionOrb, { backgroundColor: `${palette.primary}1A` }]}>
                  <MaterialCommunityIcons name={opt.icon} size={22} color={palette.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.optionSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                    {opt.sub}
                  </Text>
                </View>
                {sel ? (
                  <MaterialCommunityIcons name="check-circle" size={24} color={palette.primary} />
                ) : null}
              </GlassCard>
            </Pressable>
          );
        })}
      </View>

      <GlassCard
        palette={palette}
        radius={18}
        tone="mid"
        style={[styles.insight, { borderLeftColor: palette.primary }]}>
        <MaterialCommunityIcons name="information-outline" color={palette.primary} size={22} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.insightEyebrow, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
            COACH INSIGHT
          </Text>
          <Text style={[styles.insightBody, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
            16 hours is the most-studied window. Start gentle if you're new — consistency teaches more than intensity.
          </Text>
        </View>
      </GlassCard>
    </>
  );
}

// ─── Step 2: Dietary Profile ───────────────────────────────────────────────

function DietStep({
  palette,
  selected,
  onSelect,
}: {
  palette: CoachPaletteColors;
  selected: DietPreferenceId;
  onSelect: (d: DietPreferenceId) => void;
}) {
  function tone(id: DietPreferenceId): string {
    const accent = DIET_ACCENT[id];
    if (accent === 'secondary') return palette.secondary;
    if (accent === 'tertiary') return palette.tertiary;
    return palette.primary;
  }
  function toneBg(id: DietPreferenceId): string {
    return `${tone(id)}1A`;
  }

  return (
    <>
      <View style={styles.heroWrap}>
        <View style={[styles.heroIconWrap, { backgroundColor: palette.primaryContainer }]}>
          <MaterialCommunityIcons name={DIET_ICONS[selected]} size={36} color={palette.onPrimaryContainer} />
        </View>
        <Text style={[styles.heroTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.display }]}>
          Tailored for you.
        </Text>
        <Text style={[styles.heroSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
          How do you usually eat? This personalizes meal suggestions and fasting phases.
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: selected === 'omnivore' }}
          onPress={() => onSelect('omnivore')}>
          <GlassCard
            palette={palette}
            radius={20}
            tone={selected === 'omnivore' ? 'high' : 'mid'}
            style={[
              styles.heroDiet,
              {
                borderColor: selected === 'omnivore' ? palette.primary : palette.glassBorder,
                borderWidth: selected === 'omnivore' ? 1.8 : StyleSheet.hairlineWidth,
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
            {selected === 'omnivore' ? (
              <MaterialCommunityIcons name="check-circle" size={24} color={palette.primary} />
            ) : null}
          </GlassCard>
        </Pressable>

        <View style={styles.gridRow}>
          {DIET_OPTIONS.filter((o) => o.id !== 'omnivore').map((opt) => {
            const sel = selected === opt.id;
            const accent = tone(opt.id);
            return (
              <Pressable
                key={opt.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: sel }}
                accessibilityLabel={`${opt.label}: ${opt.description}`}
                onPress={() => onSelect(opt.id)}
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
                  <Text style={[styles.gridTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
                    {opt.label}
                  </Text>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

// ─── Step 3: Hydration Goal ────────────────────────────────────────────────

function WaterStep({
  palette,
  selected,
  onSelect,
}: {
  palette: CoachPaletteColors;
  selected: number;
  onSelect: (ml: number) => void;
}) {
  return (
    <>
      <View style={styles.heroWrap}>
        <View style={[styles.heroIconWrap, { backgroundColor: palette.secondaryContainer }]}>
          <MaterialCommunityIcons name="water" size={36} color={palette.onSecondaryContainer} />
        </View>
        <Text style={[styles.heroTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.display }]}>
          Daily hydration.
        </Text>
        <Text style={[styles.heroSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
          Pick a comfortable daily target. Hot weather and exercise may call for more — adjust anytime.
        </Text>
      </View>

      <View style={styles.gridRow}>
        {WATER_GOAL_OPTIONS.map((opt) => {
          const sel = selected === opt.ml;
          return (
            <Pressable
              key={opt.ml}
              accessibilityRole="radio"
              accessibilityState={{ checked: sel }}
              accessibilityLabel={`${opt.label} daily — ${opt.sub}`}
              onPress={() => onSelect(opt.ml)}
              style={styles.gridCell}>
              <GlassCard
                palette={palette}
                radius={20}
                tone={sel ? 'high' : 'mid'}
                style={[
                  styles.waterCard,
                  {
                    borderColor: sel ? palette.secondary : palette.glassBorder,
                    borderWidth: sel ? 1.8 : StyleSheet.hairlineWidth,
                  },
                ]}>
                <View style={[styles.dietOrb, { backgroundColor: `${palette.secondary}1A` }]}>
                  <MaterialCommunityIcons name="cup-water" size={22} color={palette.secondary} />
                </View>
                <Text style={[styles.waterLabel, { color: palette.onSurface, fontFamily: FastCoachFonts.display }]}>
                  {opt.label}
                </Text>
                <Text style={[styles.waterSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                  {opt.sub}
                </Text>
                {sel ? (
                  <View style={[styles.waterCheck, { backgroundColor: palette.secondaryContainer }]}>
                    <MaterialCommunityIcons name="check" size={14} color={palette.onSecondaryContainer} />
                  </View>
                ) : null}
              </GlassCard>
            </Pressable>
          );
        })}
      </View>

      <GlassCard
        palette={palette}
        radius={18}
        tone="mid"
        style={[styles.insight, { borderLeftColor: palette.secondary }]}>
        <MaterialCommunityIcons name="water-outline" color={palette.secondary} size={22} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.insightEyebrow, { color: palette.secondary, fontFamily: FastCoachFonts.label }]}>
            HYDRATION NOTE
          </Text>
          <Text style={[styles.insightBody, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
            Common starting targets fall between 2 and 3 liters for adults — listen to your body and adjust in Settings.
          </Text>
        </View>
      </GlassCard>
    </>
  );
}

// ─── Step 4: Reminders ─────────────────────────────────────────────────────

function RemindersStep({
  palette,
  value,
  onChange,
}: {
  palette: CoachPaletteColors;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <>
      <View style={styles.heroWrap}>
        <View style={[styles.heroIconWrap, { backgroundColor: palette.tertiaryContainer }]}>
          <MaterialCommunityIcons name="bell-ring" size={36} color={palette.onTertiaryContainer} />
        </View>
        <Text style={[styles.heroTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.display }]}>
          Gentle nudges.
        </Text>
        <Text style={[styles.heroSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
          Want a tap on the shoulder at 12, 16, and 20 hours into a fast? Quiet, local-only notifications — no servers.
        </Text>
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel="Toggle fasting milestone reminders"
        onPress={() => onChange(!value)}>
        <GlassCard
          palette={palette}
          radius={22}
          tone={value ? 'high' : 'mid'}
          style={[
            styles.reminderRow,
            {
              borderColor: value ? palette.primary : palette.glassBorder,
              borderWidth: value ? 1.8 : StyleSheet.hairlineWidth,
            },
          ]}>
          <View style={[styles.optionOrb, { backgroundColor: `${palette.tertiary}1A` }]}>
            <MaterialCommunityIcons name="bell-ring-outline" size={22} color={palette.tertiary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
              Fasting Reminders
            </Text>
            <Text style={[styles.optionSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
              Local cues at 12h, 16h, and 20h milestones.
            </Text>
          </View>
          <IOSToggle
            palette={palette}
            value={value}
            onValueChange={onChange}
            accessibilityLabel="Toggle fasting reminders"
          />
        </GlassCard>
      </Pressable>

      <GlassCard
        palette={palette}
        radius={18}
        tone="mid"
        style={[styles.insight, { borderLeftColor: palette.tertiary }]}>
        <MaterialCommunityIcons name="shield-check-outline" color={palette.tertiary} size={22} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.insightEyebrow, { color: palette.tertiary, fontFamily: FastCoachFonts.label }]}>
            PRIVACY-FIRST
          </Text>
          <Text style={[styles.insightBody, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
            Reminders are scheduled on-device only. We send nothing to a server, ever. Toggle them off anytime in Settings.
          </Text>
        </View>
      </GlassCard>
    </>
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
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  progressDot: {
    height: 4,
    borderRadius: 999,
  },
  scroll: { paddingHorizontal: 22, paddingTop: 4, gap: 18 },
  heroWrap: { alignItems: 'center', marginBottom: 4, gap: 10 },
  heroIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  heroTitle: { fontSize: 34, lineHeight: 38, textAlign: 'center', fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 340 },
  optionRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionOrb: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.1 },
  optionSub: { fontSize: 13, marginTop: 2, lineHeight: 18 },
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
  waterCard: { padding: 18, gap: 6, minHeight: 130, position: 'relative' },
  waterLabel: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  waterSub: { fontSize: 12, lineHeight: 18 },
  waterCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderRow: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
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
    paddingTop: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 56,
    height: 56,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: { width: 0 },
  continueBtn: {
    flex: 1,
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
  step: { fontSize: 10, letterSpacing: 1.4, fontWeight: '800', textAlign: 'center' },
});
