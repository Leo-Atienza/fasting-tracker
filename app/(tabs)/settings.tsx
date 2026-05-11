import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FastCoachFonts, FastCoachPalette, type ColorSchemeName } from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { FixedTopBar, useTopBarOffset } from '@/src/components/fastCoach/FixedTopBar';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { IOSToggle } from '@/src/components/fastCoach/IOSToggle';
import { ScalePressable } from '@/src/components/fastCoach/ScalePressable';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
import { SectionLabel } from '@/src/components/fastCoach/SectionLabel';
import { TouchSlider } from '@/src/components/fastCoach/TouchSlider';
import rawSuggestions from '@/assets/data/eat-suggestions.json';
import { DIET_OPTIONS } from '@/src/constants/diets';
import { WATER_GOAL_MIN_ML } from '@/src/constants/waterGoals';
import type { EatSuggestion } from '@/src/domain/types';
import { aggregateMedicalSources } from '@/src/features/eat/aggregateSources';
import { ensureNotificationsPermission } from '@/src/features/notifications/scheduler';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useNotificationPermissionStatus } from '@/src/hooks/useNotificationPermissionStatus';
import { formatVolume, mlToOz } from '@/src/lib/units';
import { useAppStore, type WaterUnit } from '@/src/store/useAppStore';

const SUGGESTIONS = rawSuggestions as EatSuggestion[];

type MilestoneIcon = 'weather-sunset-up' | 'fire' | 'recycle';
const MILESTONE_OPTIONS: { hours: number; title: string; sub: string; icon: MilestoneIcon }[] = [
  { hours: 12, title: 'First milestone (12 h)', sub: 'Gentle metabolic-glide nudge.', icon: 'weather-sunset-up' },
  { hours: 16, title: 'Classic 16:8 (16 h)', sub: 'The popular checkpoint.', icon: 'fire' },
  { hours: 20, title: 'Long-window (20 h)', sub: 'Celebrate a longer hold.', icon: 'recycle' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = (colorScheme === 'dark' ? 'dark' : 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];
  const topBarOffset = useTopBarOffset();
  const bp = useBreakpoint();
  const isWide = bp !== 'phone';

  const dietPreferenceId = useAppStore((s) => s.dietPreferenceId);
  const setDiet = useAppStore((s) => s.setDietPreferenceId);

  const waterDailyGoalMl = useAppStore((s) => s.waterDailyGoalMl);
  const waterUnit = useAppStore((s) => s.waterUnit);
  const setGoal = useAppStore((s) => s.setWaterDailyGoalMl);
  const setWaterUnit = useAppStore((s) => s.setWaterUnit);
  const remindersEnabled = useAppStore((s) => s.fastingRemindersEnabled);
  const setRemindersEnabled = useAppStore((s) => s.setFastingRemindersEnabled);
  const mutedFastStartedAt = useAppStore((s) => s.mutedFastStartedAt);
  const activeFastStartedAt = useAppStore((s) => s.activeFast?.startedAt ?? null);
  const clearReminderMute = useAppStore((s) => s.clearReminderMute);
  const enabledMilestones = useAppStore((s) => s.enabledMilestones);
  const setMilestoneEnabled = useAppStore((s) => s.setMilestoneEnabled);
  const premiumDismissed = useAppStore((s) => s.premiumDismissed);
  const setPremiumDismissed = useAppStore((s) => s.setPremiumDismissed);
  const clearAllData = useAppStore((s) => s.clearAllData);
  const replayOnboarding = useAppStore((s) => s.replayOnboarding);
  const permissionStatus = useNotificationPermissionStatus();
  const showPermissionBlockedChip = remindersEnabled && permissionStatus === 'denied';
  const showPausedChip =
    remindersEnabled &&
    !showPermissionBlockedChip &&
    activeFastStartedAt !== null &&
    mutedFastStartedAt !== null &&
    mutedFastStartedAt === activeFastStartedAt;

  const [dietPickerOpen, setDietPickerOpen] = useState(false);

  const currentDiet = useMemo(
    () => DIET_OPTIONS.find((d) => d.id === dietPreferenceId) ?? DIET_OPTIONS[3]!,
    [dietPreferenceId],
  );

  const sourcesCount = useMemo(() => aggregateMedicalSources(SUGGESTIONS).length, []);

  function onSliderChange(next: number) {
    setGoal(Math.round(next));
  }

  async function onRemindersToggle(next: boolean) {
    if (!next) {
      setRemindersEnabled(false);
      return;
    }
    const ok = await ensureNotificationsPermission();
    if (!ok) {
      Alert.alert(
        'Notifications are blocked',
        'Reminders are turned off at the OS level. Open system settings and enable notifications for Fasting Tracker, then toggle this on again.',
      );
      return;
    }
    setRemindersEnabled(true);
  }

  function confirmReplayOnboarding() {
    Alert.alert(
      'Replay onboarding?',
      "Your fast history, water log, and favorites stay intact. You'll just walk through the welcome flow again with your current choices preselected.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replay', onPress: () => replayOnboarding() },
      ],
    );
  }

  function confirmClearAll() {
    Alert.alert(
      'Clear all data?',
      'This wipes your fast history, water log, favorites, and preferences. Onboarding will restart.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Are you absolutely sure?', 'This cannot be undone.', [
              { text: 'No, keep my data', style: 'cancel' },
              {
                text: 'Yes, wipe everything',
                style: 'destructive',
                onPress: () => {
                  clearAllData();
                  Alert.alert('Cleared', 'All data has been reset. Restart the app to re-run onboarding.');
                },
              },
            ]);
          },
        },
      ],
    );
  }

  const goalDisplay =
    waterUnit === 'oz'
      ? `${Math.round(mlToOz(waterDailyGoalMl))} oz`
      : `${Math.round(waterDailyGoalMl)} ml`;

  return (
    <ScreenBackground palette={palette} accent="settings">
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <FixedTopBar
          title="Settings"
          palette={palette}
          isDark={scheme === 'dark'}
          showHistory={false}
          rightAccessory={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close settings"
              hitSlop={10}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
              <MaterialCommunityIcons name="close" size={22} color={palette.onSurfaceVariant} />
            </Pressable>
          }
        />

        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topBarOffset + 20 },
            isWide && { maxWidth: 720, alignSelf: 'center', width: '100%' },
          ]}
          showsVerticalScrollIndicator={false}>
          {/* Profile mini-card */}
          <GlassCard palette={palette} radius={24} tone="mid" style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: palette.primaryContainer }]}>
              <MaterialCommunityIcons name="account" size={28} color={palette.onPrimaryContainer} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
                Fasting Tracker User
              </Text>
              <Text style={[styles.profileSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                Personalized fasting profile
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" color={palette.outline} size={22} />
          </GlassCard>

          {/* PREFERENCES */}
          <SectionLabel palette={palette}>PREFERENCES</SectionLabel>
          <GlassCard palette={palette} radius={22} style={styles.sectionCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change diet preference"
              onPress={() => setDietPickerOpen(true)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.88 }]}>
              <View style={[styles.rowOrb, { backgroundColor: `${palette.primary}1A` }]}>
                <MaterialCommunityIcons name="silverware-fork-knife" color={palette.primary} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                  Diet Preference
                </Text>
                <Text style={[styles.rowSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
                  {currentDiet.label}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" color={palette.outline} size={22} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: `${palette.outlineVariant}55` }]} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Replay setup"
              accessibilityHint="Re-runs the 4-step welcome flow; your data stays intact."
              onPress={confirmReplayOnboarding}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.88 }]}>
              <View style={[styles.rowOrb, { backgroundColor: `${palette.primary}1A` }]}>
                <MaterialCommunityIcons name="restart" color={palette.primary} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                  Replay setup
                </Text>
                <Text style={[styles.rowSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
                  Re-run the 4-step welcome flow
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" color={palette.outline} size={22} />
            </Pressable>
          </GlassCard>

          {/* REMINDERS */}
          <SectionLabel palette={palette}>REMINDERS</SectionLabel>
          <GlassCard palette={palette} radius={22} style={styles.sectionCard}>
            <View style={styles.row}>
              <View style={[styles.rowOrb, { backgroundColor: `${palette.tertiary}1A` }]}>
                <MaterialCommunityIcons name="bell-ring" color={palette.tertiary} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                  Fasting Reminders
                </Text>
                <Text style={[styles.rowSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
                  Local cues at common fast milestones.
                </Text>
              </View>
              <IOSToggle
                palette={palette}
                value={remindersEnabled}
                onValueChange={onRemindersToggle}
                accessibilityLabel="Toggle fasting reminders"
              />
            </View>

            {showPermissionBlockedChip ? (
              <>
                <View style={[styles.divider, { backgroundColor: `${palette.outlineVariant}55` }]} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Notifications are blocked at the system level"
                  accessibilityHint="Opens system settings."
                  onPress={() => {
                    Linking.openSettings().catch(() => undefined);
                  }}
                  style={({ pressed }) => [
                    styles.permissionChip,
                    { borderLeftColor: palette.error },
                    pressed && { opacity: 0.86 },
                  ]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={22} color={palette.error} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.permissionEyebrow, { color: palette.error, fontFamily: FastCoachFonts.label }]}>
                      NOTIFICATIONS BLOCKED
                    </Text>
                    <Text style={[styles.permissionBody, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                      Reminders won&apos;t fire until you re-enable them in system settings.
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" color={palette.outline} size={20} />
                </Pressable>
              </>
            ) : null}

            {showPausedChip ? (
              <>
                <View style={[styles.divider, { backgroundColor: `${palette.outlineVariant}55` }]} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Reminders paused for this fast"
                  accessibilityHint="Tap to clear the pause and resume milestone nudges now."
                  onPress={clearReminderMute}
                  style={({ pressed }) => [
                    styles.permissionChip,
                    { borderLeftColor: palette.outline },
                    pressed && { opacity: 0.86 },
                  ]}>
                  <MaterialCommunityIcons name="bell-sleep-outline" size={22} color={palette.outline} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.permissionEyebrow, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
                      PAUSED THIS FAST
                    </Text>
                    <Text style={[styles.permissionBody, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                      Reminders resume on your next fast — or pull down notifications and tap Resume.
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" color={palette.outline} size={20} />
                </Pressable>
              </>
            ) : null}

            <View style={[styles.divider, { backgroundColor: `${palette.outlineVariant}55` }]} />

            <Text style={[styles.subSectionTitle, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.label, marginTop: 12, letterSpacing: 1.4 }]}>
              CHOOSE YOUR MILESTONES
            </Text>

            {MILESTONE_OPTIONS.map((opt, idx) => {
              const isOn = enabledMilestones.includes(opt.hours);
              const isLast = idx === MILESTONE_OPTIONS.length - 1;
              return (
                <React.Fragment key={opt.hours}>
                  <View style={[styles.row, !remindersEnabled && { opacity: 0.55 }]}>
                    <View style={[styles.rowOrb, { backgroundColor: `${palette.tertiary}1A` }]}>
                      <MaterialCommunityIcons name={opt.icon} color={palette.tertiary} size={20} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                        {opt.title}
                      </Text>
                      <Text style={[styles.rowSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
                        {opt.sub}
                      </Text>
                    </View>
                    <IOSToggle
                      palette={palette}
                      value={isOn}
                      onValueChange={(next) => setMilestoneEnabled(opt.hours, next)}
                      accessibilityLabel={`Toggle ${opt.hours} hour milestone`}
                    />
                  </View>
                  {!isLast ? (
                    <View style={[styles.divider, { backgroundColor: `${palette.outlineVariant}55` }]} />
                  ) : null}
                </React.Fragment>
              );
            })}
          </GlassCard>

          {/* HYDRATION */}
          <SectionLabel palette={palette}>HYDRATION</SectionLabel>
          <GlassCard palette={palette} radius={22} style={styles.sectionCard}>
            <View style={[styles.row, { paddingBottom: 6 }]}>
              <View style={[styles.rowOrb, { backgroundColor: `${palette.secondary}1A` }]}>
                <MaterialCommunityIcons name="water" color={palette.secondary} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                  Daily Water Goal
                </Text>
              </View>
              <Text style={[styles.goalValue, { color: palette.secondary, fontFamily: FastCoachFonts.headlineMd }]}>
                {goalDisplay}
              </Text>
            </View>
            <View style={styles.sliderWrap}>
              <TouchSlider
                palette={palette}
                value={waterDailyGoalMl}
                min={WATER_GOAL_MIN_ML}
                max={5000}
                step={50}
                accentColor={palette.secondary}
                onChange={onSliderChange}
                accessibilityLabel="Daily water goal"
              />
              <View style={styles.sliderRange}>
                <Text style={[styles.rangeText, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
                  {formatVolume(WATER_GOAL_MIN_ML, waterUnit)}
                </Text>
                <Text style={[styles.rangeText, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
                  {formatVolume(5000, waterUnit)}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: `${palette.outlineVariant}55`, marginVertical: 10 }]} />

            <Text style={[styles.subSectionTitle, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
              Display Units
            </Text>
            <View style={[styles.segment, { backgroundColor: `${palette.surfaceContainerLow}DD` }]}>
              {(['ml', 'oz'] as WaterUnit[]).map((u) => (
                <ScalePressable
                  key={u}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: waterUnit === u }}
                  accessibilityLabel={u === 'ml' ? 'Milliliters unit' : 'Ounces unit'}
                  onPress={() => setWaterUnit(u)}
                  scaleTo={0.98}
                  containerStyle={[
                    styles.segItem,
                    waterUnit === u && { backgroundColor: palette.surfaceContainerLowest, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
                  ]}>
                  <Text
                    style={[
                      styles.segLabel,
                      {
                        color: waterUnit === u ? palette.secondary : palette.onSurfaceVariant,
                        fontFamily: FastCoachFonts.label,
                      },
                    ]}>
                    {u === 'ml' ? 'Milliliters (ml)' : 'Ounces (oz)'}
                  </Text>
                </ScalePressable>
              ))}
            </View>
          </GlassCard>

          {/* COACH NOTE / PREMIUM placeholder */}
          {!premiumDismissed ? (
            <GlassCard palette={palette} radius={24} tone="mid" style={styles.premium}>
              <View style={[styles.premiumOverlay, { backgroundColor: `${palette.primary}EE` }]} />
              <View style={styles.premiumBlob} />
              <View style={styles.premiumContent}>
                <View style={styles.premiumBadge}>
                  <Text style={[styles.premiumBadgeText, { fontFamily: FastCoachFonts.label }]}>COACH NOTE</Text>
                </View>
                <Text style={[styles.premiumTitle, { fontFamily: FastCoachFonts.headlineMd }]}>
                  Consistency beats perfection.
                </Text>
                <Text style={[styles.premiumBody, { fontFamily: FastCoachFonts.body }]}>
                  Sustainable schedules teach more about your body than extreme plans.
                </Text>
                <View style={styles.premiumActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss coach note"
                    onPress={() => setPremiumDismissed(true)}
                    style={({ pressed }) => [styles.premiumDismiss, pressed && { opacity: 0.8 }]}>
                    <Text style={[styles.premiumDismissText, { fontFamily: FastCoachFonts.label }]}>Dismiss</Text>
                  </Pressable>
                </View>
              </View>
            </GlassCard>
          ) : null}

          {/* ABOUT */}
          <SectionLabel palette={palette}>ABOUT</SectionLabel>
          <GlassCard palette={palette} radius={22} style={styles.sectionCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open sources and credits"
              accessibilityHint="See every medical source cited by the meal presets."
              onPress={() => router.push('/credits')}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.88 }]}>
              <View style={[styles.rowOrb, { backgroundColor: `${palette.tertiary}1A` }]}>
                <MaterialCommunityIcons name="book-open-variant" color={palette.tertiary} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                  Sources & credits
                </Text>
                <Text style={[styles.rowSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
                  {sourcesCount} medical reference{sourcesCount === 1 ? '' : 's'} used in meal presets
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" color={palette.outline} size={22} />
            </Pressable>
          </GlassCard>

          {/* DANGER ZONE */}
          <SectionLabel palette={palette}>DANGER ZONE</SectionLabel>
          <GlassCard palette={palette} radius={22} style={styles.sectionCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear all data, restarts onboarding"
              accessibilityHint="Double-confirm dialog will follow."
              onPress={confirmClearAll}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.86 }]}>
              <View style={[styles.rowOrb, { backgroundColor: `${palette.error}1A` }]}>
                <MaterialCommunityIcons name="trash-can-outline" color={palette.error} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: palette.error, fontFamily: FastCoachFonts.body }]}>
                  Clear all data
                </Text>
                <Text style={[styles.rowSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
                  Erases fasts, water, favorites, preferences.
                </Text>
              </View>
            </Pressable>
          </GlassCard>

          <Text style={[styles.versionFooter, { color: palette.outline, fontFamily: FastCoachFonts.body }]}>
            Fasting Tracker v{Constants.expoConfig?.version ?? '1.0.0'}{'\n'}Made for steadier rhythms.
          </Text>
        </ScrollView>

        {/* Diet picker modal */}
        <Modal transparent visible={dietPickerOpen} animationType="fade" onRequestClose={() => setDietPickerOpen(false)}>
          <Pressable
            style={[styles.modalBackdrop, { backgroundColor: `${palette.inverseSurface}66` }]}
            onPress={() => setDietPickerOpen(false)}>
            <Pressable
              style={[
                styles.sheet,
                { backgroundColor: palette.surfaceContainerLowest, borderColor: palette.glassBorder },
              ]}
              onPress={() => undefined}>
              <Text style={[styles.sheetTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
                Diet preference
              </Text>
              <Text style={{ color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body, marginBottom: 6 }}>
                Tailors meal suggestions across the app.
              </Text>
              {DIET_OPTIONS.map((opt) => {
                const sel = opt.id === dietPreferenceId;
                return (
                  <Pressable
                    key={opt.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: sel }}
                    onPress={() => {
                      setDiet(opt.id);
                      setDietPickerOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.dietRow,
                      {
                        backgroundColor: sel ? `${palette.primary}10` : 'transparent',
                        borderColor: sel ? palette.primary : palette.outlineVariant,
                      },
                      pressed && { opacity: 0.9 },
                    ]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dietTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.dietSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
                        {opt.description}
                      </Text>
                    </View>
                    {sel ? (
                      <MaterialCommunityIcons name="check-circle" size={22} color={palette.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close diet picker"
                onPress={() => setDietPickerOpen(false)}
                style={[styles.sheetBtn, { backgroundColor: palette.primary, marginTop: 12 }]}>
                <Text style={[styles.sheetBtnText, { color: palette.onPrimary, fontFamily: FastCoachFonts.headlineMd }]}>
                  Done
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingBottom: 140, gap: 14 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontSize: 18, fontWeight: '800' },
  profileSub: { fontSize: 13, marginTop: 2 },
  sectionCard: { padding: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowOrb: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  permissionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
  },
  permissionEyebrow: { fontSize: 11, letterSpacing: 1.6, fontWeight: '800' },
  permissionBody: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  goalValue: { fontSize: 18, fontWeight: '800' },
  sliderWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  sliderRange: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  rangeText: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700' },
  subSectionTitle: { fontSize: 12, paddingHorizontal: 16, marginBottom: 6 },
  segment: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginBottom: 14,
    padding: 4,
    borderRadius: 999,
  },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 999 },
  segLabel: { fontSize: 12, fontWeight: '700' },
  premium: {
    overflow: 'hidden',
    position: 'relative',
    minHeight: 150,
    padding: 0,
  },
  premiumOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  premiumBlob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    right: -80,
    top: -80,
  },
  premiumContent: { padding: 22, gap: 8 },
  premiumBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  premiumBadgeText: { color: '#ffffff', fontSize: 10, letterSpacing: 1.4, fontWeight: '800' },
  premiumTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800', letterSpacing: -0.3, lineHeight: 26 },
  premiumBody: { color: 'rgba(255,255,255,0.86)', fontSize: 14, lineHeight: 20 },
  premiumActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  premiumDismiss: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  premiumDismissText: { color: '#ffffff', fontSize: 12, letterSpacing: 1.2, fontWeight: '800' },
  versionFooter: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 18,
  },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', padding: 20, paddingBottom: 40 },
  sheet: {
    borderRadius: 28,
    padding: 22,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  sheetBtn: { borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  sheetBtnText: { fontSize: 16, fontWeight: '800' },
  dietRow: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  dietTitle: { fontSize: 15, fontWeight: '700' },
  dietSub: { fontSize: 12, marginTop: 2, lineHeight: 18 },
});
