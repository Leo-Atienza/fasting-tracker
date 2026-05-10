import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FastCoachFonts, FastCoachPalette, type ColorSchemeName } from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { ScalePressable } from '@/src/components/fastCoach/ScalePressable';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
import { StackTopBar } from '@/src/components/fastCoach/StackTopBar';
import { DIET_OPTIONS } from '@/src/constants/diets';
import { formatVolume, mlToOz, ozToMl } from '@/src/lib/units';
import { useAppStore, type WaterUnit } from '@/src/store/useAppStore';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = (colorScheme === 'dark' ? 'dark' : 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];

  const dietPreferenceId = useAppStore((s) => s.dietPreferenceId);
  const setDiet = useAppStore((s) => s.setDietPreferenceId);

  const waterDailyGoalMl = useAppStore((s) => s.waterDailyGoalMl);
  const waterUnit = useAppStore((s) => s.waterUnit);
  const setGoal = useAppStore((s) => s.setWaterDailyGoalMl);
  const setWaterUnit = useAppStore((s) => s.setWaterUnit);
  const clearAllData = useAppStore((s) => s.clearAllData);

  function confirmClearAll() {
    // First dialog: are you sure?
    Alert.alert(
      'Clear all data?',
      'This wipes your fast history, water log, favorites, and preferences. Onboarding will restart.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            // Second dialog: type the word? Use a second confirm step instead
            // (Alert can't render an input on Android pre-API 28 reliably).
            Alert.alert(
              'Are you absolutely sure?',
              'This cannot be undone.',
              [
                { text: 'No, keep my data', style: 'cancel' },
                {
                  text: 'Yes, wipe everything',
                  style: 'destructive',
                  onPress: () => {
                    clearAllData();
                    Alert.alert('Cleared', 'All data has been reset. Restart the app to re-run onboarding.');
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }

  const [draftGoal, setDraftGoal] = useState(String(Math.round(waterDailyGoalMl)));

  useFocusEffect(
    useCallback(() => {
      const canonicalMl = useAppStore.getState().waterDailyGoalMl;
      const unit = useAppStore.getState().waterUnit;
      const display =
        unit === 'oz' ? Math.round(mlToOz(canonicalMl)) : Math.round(canonicalMl);
      setDraftGoal(String(display));
    }, []),
  );

  function commitGoal(nextGoalMl?: number) {
    const parsed = nextGoalMl ?? (() => {
      const n = Number(draftGoal);
      return Number.isNaN(n) ? NaN : (waterUnit === 'oz' ? ozToMl(n) : Math.round(n));
    })();
    if (Number.isNaN(parsed)) {
      Alert.alert('Invalid goal', 'Enter numbers only.');
      return;
    }
    const ml = Math.round(parsed);
    setGoal(ml);
    setDraftGoal(String(waterUnit === 'oz' ? Math.round(mlToOz(ml)) : ml));
    Alert.alert('Saved', `Goal set to ${formatVolume(ml, waterUnit)} per day`);
  }

  const goalInCurrentUnit =
    waterUnit === 'oz' ? Math.round(mlToOz(waterDailyGoalMl)) : waterDailyGoalMl;
  const draftGoalNumber = Number(draftGoal);
  const currentDraft = Number.isFinite(draftGoalNumber) ? Math.max(0, Math.round(draftGoalNumber)) : goalInCurrentUnit;
  const step = waterUnit === 'oz' ? 1 : 50;

  return (
    <ScreenBackground palette={palette}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
          <StackTopBar title="Settings" palette={palette} onBack={() => router.back()} />

          <GlassCard palette={palette} style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: palette.primaryContainer }]}>
              <Text style={[styles.avatarText, { color: palette.onPrimaryContainer, fontFamily: FastCoachFonts.headlineMd }]}>
                FC
              </Text>
            </View>
            <View style={styles.profileText}>
              <Text style={[styles.profileName, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
                Fast Coach User
              </Text>
              <Text style={[styles.profilePlan, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                Personalized fasting profile
              </Text>
            </View>
          </GlassCard>

          <Text style={[styles.sectionLabel, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.label }]}>
            Preferences
          </Text>
          <GlassCard palette={palette} style={styles.sectionCard}>
            {DIET_OPTIONS.map((opt, index) => {
              const selected = dietPreferenceId === opt.id;
              return (
                <View key={opt.id}>
                  <ScalePressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => setDiet(opt.id)}
                    containerStyle={styles.row}
                    scaleTo={0.99}>
                    <View style={[styles.iconChip, { backgroundColor: selected ? palette.primaryContainer : palette.surfaceContainerLow }]}>
                      <Text style={{ color: selected ? palette.onPrimaryContainer : palette.onSurfaceVariant }}>
                        {selected ? '✓' : '•'}
                      </Text>
                    </View>
                    <View style={styles.rowText}>
                      <Text style={[styles.rowTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.rowSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
                        {opt.description}
                      </Text>
                    </View>
                  </ScalePressable>
                  {index < DIET_OPTIONS.length - 1 ? <View style={[styles.divider, { backgroundColor: palette.outlineVariant }]} /> : null}
                </View>
              );
            })}
          </GlassCard>

          <Text style={[styles.sectionLabel, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.label }]}>
            Hydration
          </Text>
          <GlassCard palette={palette} style={styles.sectionCard}>
            <View style={styles.rowTop}>
              <Text style={[styles.rowTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                Daily Water Goal
              </Text>
              <Text style={[styles.goalValue, { color: palette.secondary, fontFamily: FastCoachFonts.headlineMd }]}>
                {goalInCurrentUnit} {waterUnit}
              </Text>
            </View>
            <View style={styles.goalAdjustRow}>
              <ScalePressable
                accessibilityRole="button"
                accessibilityLabel="Decrease water goal"
                onPress={() => setDraftGoal(String(Math.max(0, currentDraft - step)))}
                scaleTo={0.96}>
                <View style={[styles.adjustBtn, { backgroundColor: palette.surfaceContainerLow }]}>
                <Text style={[styles.adjustLabel, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.label }]}>
                  -{step}
                </Text>
                </View>
              </ScalePressable>
              <Text style={[styles.goalDraft, { color: palette.secondary, fontFamily: FastCoachFonts.display }]}>
                {currentDraft}
              </Text>
              <ScalePressable
                accessibilityRole="button"
                accessibilityLabel="Increase water goal"
                onPress={() => setDraftGoal(String(currentDraft + step))}
                scaleTo={0.96}>
                <View style={[styles.adjustBtn, { backgroundColor: palette.surfaceContainerLow }]}>
                <Text style={[styles.adjustLabel, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.label }]}>
                  +{step}
                </Text>
                </View>
              </ScalePressable>
            </View>
            <View style={[styles.segment, { backgroundColor: palette.glassFill }]}>
              {(['ml', 'oz'] as WaterUnit[]).map((u) => (
                <ScalePressable
                  key={u}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: waterUnit === u }}
                  accessibilityLabel={u === 'ml' ? 'Milliliters unit' : 'Ounces unit'}
                  onPress={() => {
                    const draftNum = Number(draftGoal);
                    if (Number.isFinite(draftNum) && draftNum >= 0) {
                      let nextDisplay: number;
                      if (u === waterUnit) {
                        nextDisplay = Math.round(draftNum);
                      } else if (u === 'oz') {
                        nextDisplay = Math.round(mlToOz(draftNum));
                      } else {
                        nextDisplay = ozToMl(draftNum);
                      }
                      setWaterUnit(u);
                      setDraftGoal(String(nextDisplay));
                      return;
                    }
                    const canonicalMl = useAppStore.getState().waterDailyGoalMl;
                    setWaterUnit(u);
                    setDraftGoal(String(u === 'oz' ? Math.round(mlToOz(canonicalMl)) : Math.round(canonicalMl)));
                  }}
                  scaleTo={0.985}
                  containerStyle={[
                    styles.segmentItem,
                    waterUnit === u && { backgroundColor: palette.surfaceContainerLowest },
                  ]}>
                  <Text
                    style={[
                      styles.segmentLabel,
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

          <ScalePressable
            accessibilityRole="button"
            accessibilityLabel="Save hydration goal"
            onPress={() => commitGoal()}
            scaleTo={0.985}>
            <View style={[styles.saveBtn, { backgroundColor: palette.primary }]}>
              <Text style={[styles.saveText, { color: palette.onPrimary, fontFamily: FastCoachFonts.label }]}>
                Save hydration goal
              </Text>
            </View>
          </ScalePressable>

          <Text style={[styles.sectionLabel, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.label }]}>
            Danger zone
          </Text>
          <ScalePressable
            accessibilityRole="button"
            accessibilityLabel="Clear all data, restarts onboarding"
            accessibilityHint="Double-confirm dialog will follow."
            onPress={confirmClearAll}
            scaleTo={0.985}>
            <View
              style={[
                styles.dangerBtn,
                { backgroundColor: `${palette.error}18`, borderColor: `${palette.error}55` },
              ]}>
              <Text style={[styles.dangerText, { color: palette.error, fontFamily: FastCoachFonts.label }]}>
                Clear all data
              </Text>
            </View>
          </ScalePressable>

          <Text
            accessibilityRole="text"
            style={[styles.versionFooter, { color: palette.outline, fontFamily: FastCoachFonts.body }]}>
            Fast Coach v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  pad: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  profileCard: { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20 },
  profileText: { flex: 1 },
  profileName: { fontSize: 18 },
  profilePlan: { fontSize: 13, marginTop: 2 },
  sectionLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 6 },
  sectionCard: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 4 },
  iconChip: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, lineHeight: 20 },
  rowSub: { fontSize: 13, lineHeight: 18, marginTop: 1 },
  goalValue: { fontSize: 22 },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 6,
  },
  goalAdjustRow: {
    marginTop: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adjustBtn: {
    minWidth: 72,
    borderRadius: 999,
    paddingVertical: 9,
    alignItems: 'center',
  },
  adjustLabel: { fontSize: 13 },
  goalDraft: { fontSize: 30 },
  segment: {
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 999,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  segmentLabel: { fontSize: 12 },
  saveBtn: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveText: { fontSize: 15 },
  dangerBtn: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  dangerText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  versionFooter: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 28,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
});
