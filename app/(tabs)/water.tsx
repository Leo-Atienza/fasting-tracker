import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FastCoachFonts, FastCoachPalette, type ColorSchemeName } from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { CircularRing } from '@/src/components/fastCoach/CircularRing';
import { FixedTopBar, FIXED_TOP_BAR_HEIGHT } from '@/src/components/fastCoach/FixedTopBar';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
import type { WaterLogEntry } from '@/src/domain/types';
import { WATER_PRESETS, WATER_PRIMARY_PRESET_IDS, presetsByPrimaryThenRest } from '@/src/features/water/presets';
import { dayKeyForIso, formatTimeOnly } from '@/src/lib/time';
import { formatVolume, ozToMl } from '@/src/lib/units';
import { selectWaterTodayMl } from '@/src/store/selectors';
import { useAppStore } from '@/src/store/useAppStore';

const ICON_BY_PRESET: Record<string, 'cup-water' | 'bottle-soda-classic-outline' | 'coffee-outline' | 'water'> = {
  glass: 'cup-water',
  bottle: 'bottle-soda-classic-outline',
  mug: 'coffee-outline',
  sip: 'water',
  bottle_half: 'bottle-soda-classic-outline',
  bottle_lg: 'bottle-soda-classic-outline',
};

const RING = 248;
const RING_STROKE = 14;

function filteredToday(entries: WaterLogEntry[]): WaterLogEntry[] {
  const today = dayKeyForIso(new Date().toISOString());
  return entries
    .filter((e) => dayKeyForIso(e.at) === today)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

function labelForPresetId(id: string | undefined): string {
  if (!id) return 'Custom pour';
  return presetsByPrimaryThenRest().find((p) => p.id === id)?.label ?? 'Custom pour';
}

export default function WaterScreen() {
  const scheme = (useColorScheme() ?? 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];

  const unit = useAppStore((s) => s.waterUnit);
  const waterEntries = useAppStore((s) => s.waterEntries);
  const goalMl = useAppStore((s) => s.waterDailyGoalMl);
  const addWater = useAppStore((s) => s.addWaterMl);
  const removeWater = useAppStore((s) => s.removeWaterEntry);

  const [editMode, setEditMode] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState('');

  const totalMl = selectWaterTodayMl(waterEntries);
  const pct = goalMl <= 0 ? 0 : Math.min(100, Math.round((totalMl / goalMl) * 100));
  const progress = goalMl <= 0 ? 0 : Math.min(1, totalMl / goalMl);
  const log = filteredToday(waterEntries);

  const allPresets = useMemo(() => presetsByPrimaryThenRest(), []);
  const primary = allPresets.filter((p) => WATER_PRIMARY_PRESET_IDS.includes(p.id));
  const extra = allPresets.filter((p) => !WATER_PRIMARY_PRESET_IDS.includes(p.id));

  function submitCustomPour() {
    const n = Number(customDraft.replace(',', '.'));
    if (Number.isNaN(n) || n <= 0) {
      Alert.alert('Hmm', `Enter a positive amount in ${unit}.`);
      return;
    }
    const ml = unit === 'oz' ? ozToMl(n) : Math.round(n);
    addWater(ml);
    setCustomOpen(false);
    setCustomDraft('');
  }

  function presetCard(preset: (typeof primary)[number]) {
    const iconName = ICON_BY_PRESET[preset.id] ?? 'water';
    return (
      <GlassCard palette={palette} radius={22} key={preset.id} style={styles.quickCell}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${formatVolume(preset.ml, unit)} (${preset.label})`}
          style={styles.quickPressable}
          onPress={() => addWater(preset.ml, { presetId: preset.id })}>
          <View style={[styles.quickOrb, { backgroundColor: palette.secondaryFixed }]}>
            <MaterialCommunityIcons name={iconName} color={palette.secondary} size={26} />
          </View>
          <Text style={[styles.quickTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
            {preset.label}
          </Text>
          <Text style={[styles.quickSub, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
            {formatVolume(preset.ml, unit)}
          </Text>
        </Pressable>
      </GlassCard>
    );
  }

  return (
    <ScreenBackground palette={palette} accent="water">
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <FixedTopBar title="Fast Coach" palette={palette} isDark={scheme === 'dark'} />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: FIXED_TOP_BAR_HEIGHT + 28 }]}
          showsVerticalScrollIndicator={false}>
          {/* Hydration ring */}
          <View style={styles.ringWrap}>
            <View style={[styles.ringHalo, { shadowColor: palette.secondaryContainer }]}>
              <CircularRing
                size={RING}
                stroke={RING_STROKE}
                progress={Math.max(0.04, progress)}
                svgGradientId="fastCoachWaterRing"
                trackColor={`${palette.secondaryFixed}99`}
                gradientStart={palette.secondaryContainer}
                gradientEnd={palette.secondary}>
                <View
                  style={[
                    styles.ringInner,
                    {
                      backgroundColor: scheme === 'dark' ? 'rgba(26,28,31,0.86)' : 'rgba(255,255,255,0.94)',
                      width: RING - RING_STROKE * 2 - 28,
                      height: RING - RING_STROKE * 2 - 28,
                    },
                  ]}>
                  <Text style={[styles.pctText, { color: palette.onSurface, fontFamily: FastCoachFonts.display }]}>
                    {pct}
                    <Text style={[styles.pctTiny, { color: palette.outline }]}>%</Text>
                  </Text>
                  <Text style={[styles.ringSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                    {formatVolume(totalMl, unit)} / {formatVolume(goalMl, unit)}
                  </Text>
                </View>
              </CircularRing>
            </View>
            <Text style={[styles.motivate, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
              {pct >= 100
                ? "You hit today's hydration goal — nicely done."
                : `You're on track! Keep hydrating to reach your daily goal.`}
            </Text>
          </View>

          {/* Quick Add 3-col grid */}
          <Text style={[styles.sectionH, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
            Quick Add
          </Text>
          <View style={styles.quickGrid}>
            {primary.map((p) => presetCard(p))}
          </View>

          {/* Custom entry CTA */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open custom water entry"
            onPress={() => {
              setCustomDraft('');
              setCustomOpen(true);
            }}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: palette.secondaryContainer,
                shadowColor: palette.secondary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}>
            <MaterialCommunityIcons name="cup-water" color={palette.onSecondaryContainer} size={22} />
            <Text style={[styles.ctaText, { color: palette.onSecondaryContainer, fontFamily: FastCoachFonts.headlineMd }]}>
              Custom Entry
            </Text>
          </Pressable>

          {/* Extra presets (compact) */}
          {extra.length > 0 ? (
            <View style={styles.extraRow}>
              {extra.map((preset) => {
                const iconName = ICON_BY_PRESET[preset.id] ?? 'water';
                return (
                  <Pressable
                    key={preset.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${formatVolume(preset.ml, unit)} (${preset.label})`}
                    onPress={() => addWater(preset.ml, { presetId: preset.id })}
                    style={({ pressed }) => [
                      styles.extraChip,
                      {
                        borderColor: palette.outlineVariant,
                        backgroundColor: scheme === 'dark' ? 'rgba(26,28,31,0.55)' : 'rgba(255,255,255,0.70)',
                      },
                      pressed && { opacity: 0.85 },
                    ]}>
                    <MaterialCommunityIcons name={iconName} size={18} color={palette.secondary} />
                    <Text style={{ color: palette.onSurface, fontFamily: FastCoachFonts.body, fontSize: 13 }}>
                      {preset.label}
                    </Text>
                    <Text style={{ color: palette.outline, fontFamily: FastCoachFonts.label, fontSize: 11 }}>
                      {formatVolume(preset.ml, unit)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* Today's Log */}
          <View style={styles.logHeading}>
            <Text style={[styles.sectionH, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
              {"Today's Log"}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={editMode ? 'Finish editing hydration log' : 'Edit hydration log'}
              hitSlop={10}
              onPress={() => setEditMode((e) => !e)}>
              <Text style={[styles.editLink, { color: palette.secondary, fontFamily: FastCoachFonts.label }]}>
                {editMode ? 'Done' : 'Edit'}
              </Text>
            </Pressable>
          </View>

          <GlassCard palette={palette} radius={26} style={styles.logCard}>
            {log.length === 0 ? (
              <Text style={[styles.emptyLog, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                No pours yet — tap a quick add tile or craft a custom amount.
              </Text>
            ) : (
              log.map((entry, idx) => (
                <View
                  key={entry.id}
                  style={[
                    styles.logRow,
                    idx !== log.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: `${palette.outlineVariant}88`,
                    },
                  ]}>
                  <View style={styles.logLeft}>
                    <View style={[styles.logOrb, { backgroundColor: `${palette.secondaryFixed}AA` }]}>
                      <MaterialCommunityIcons
                        name={ICON_BY_PRESET[entry.presetId ?? ''] ?? 'water'}
                        size={18}
                        color={palette.secondary}
                      />
                    </View>
                    <View>
                      <Text style={[styles.logTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                        {labelForPresetId(entry.presetId)}
                      </Text>
                      <Text style={[styles.logTime, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
                        {formatTimeOnly(entry.at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.logRight}>
                    <Text style={[styles.logMl, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
                      {formatVolume(entry.ml, unit)}
                    </Text>
                    {editMode ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${entry.ml} milliliter pour`}
                        onPress={() =>
                          Alert.alert(
                            'Remove pour?',
                            `${formatVolume(entry.ml, unit)} logged at ${formatTimeOnly(entry.at)}`,
                            [
                              { text: 'Keep', style: 'cancel' },
                              { text: 'Remove', style: 'destructive', onPress: () => removeWater(entry.id) },
                            ],
                          )
                        }
                        hitSlop={12}>
                        <MaterialCommunityIcons name="trash-can-outline" color={palette.error} size={22} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </GlassCard>
        </ScrollView>

        <Modal transparent visible={customOpen} animationType="fade" onRequestClose={() => setCustomOpen(false)}>
          <Pressable
            style={[styles.modalBackdrop, { backgroundColor: `${palette.inverseSurface}66` }]}
            onPress={() => setCustomOpen(false)}>
            <Pressable
              style={[
                styles.sheet,
                { backgroundColor: palette.surfaceContainerLowest, borderColor: palette.glassBorder },
              ]}
              onPress={() => undefined}>
              <Text style={[styles.sheetTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
                Custom pour
              </Text>
              <Text style={{ color: palette.onSurfaceVariant, marginBottom: 8, fontFamily: FastCoachFonts.body }}>
                Enter amount in <Text style={{ fontWeight: '800' }}>{unit}</Text>, rounded for quick logging.
              </Text>
              <TextInput
                value={customDraft}
                onChangeText={setCustomDraft}
                keyboardType="decimal-pad"
                placeholder={`e.g. ${unit === 'oz' ? '12' : '400'}`}
                placeholderTextColor={palette.outline}
                style={[styles.input, { borderColor: palette.outlineVariant, color: palette.onSurface }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add custom pour to today's log"
                onPress={() => submitCustomPour()}
                style={[styles.sheetBtn, { backgroundColor: palette.secondaryContainer }]}>
                <Text style={[styles.sheetBtnText, { color: palette.onSecondaryContainer, fontFamily: FastCoachFonts.headlineMd }]}>
                  Add to log
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
  scroll: { paddingHorizontal: 22, paddingBottom: 140, gap: 18 },
  ringWrap: { alignItems: 'center', gap: 14 },
  ringHalo: {
    borderRadius: 9999,
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
  },
  ringInner: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  pctText: { fontSize: 60, fontWeight: '900', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  pctTiny: { fontSize: 24, fontWeight: '700' },
  ringSub: { fontSize: 16 },
  motivate: { textAlign: 'center', fontSize: 15, lineHeight: 22, maxWidth: 280, marginTop: 2 },
  sectionH: { fontSize: 22, letterSpacing: -0.3, fontWeight: '700', marginTop: 6 },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCell: { flex: 1, padding: 0 },
  quickPressable: { padding: 18, gap: 8, alignItems: 'center' },
  quickOrb: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  quickTitle: { fontSize: 14, fontWeight: '700' },
  quickSub: { fontSize: 10, letterSpacing: 1.4, fontWeight: '800' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 28,
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    marginTop: 6,
  },
  ctaText: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  extraRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  extraChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  logHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  editLink: { fontSize: 14, fontWeight: '700' },
  logCard: { padding: 0, overflow: 'hidden' },
  emptyLog: { padding: 22, fontSize: 14 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  logLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  logOrb: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  logTitle: { fontSize: 15, fontWeight: '600' },
  logTime: { fontSize: 11, letterSpacing: 1.4, fontWeight: '700', marginTop: 2 },
  logMl: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2, fontVariant: ['tabular-nums'] },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', padding: 22, paddingBottom: 40 },
  sheet: {
    borderRadius: 28,
    padding: 22,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    shadowOffset: { width: 0, height: -4 },
    shadowColor: '#000',
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  input: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, fontSize: 18 },
  sheetBtn: { borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  sheetBtnText: { fontWeight: '800', fontSize: 16 },
});
