import FontAwesome from '@expo/vector-icons/FontAwesome';
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
import { FastCoachHeader } from '@/src/components/fastCoach/FastCoachHeader';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
import type { WaterLogEntry } from '@/src/domain/types';
import type { WaterPresetDef } from '@/src/features/water/presets';
import {
  WATER_PRESETS,
  WATER_PRIMARY_PRESET_IDS,
  presetsByPrimaryThenRest,
} from '@/src/features/water/presets';
import { dayKeyForIso, formatTimeOnly } from '@/src/lib/time';
import { formatVolume, ozToMl } from '@/src/lib/units';
import { selectWaterTodayMl } from '@/src/store/selectors';
import { useAppStore } from '@/src/store/useAppStore';

function labelForPresetId(id?: string): string | undefined {
  if (!id) return undefined;
  const preset = presetsByPrimaryThenRest().find((p) => p.id === id);
  return preset?.label;
}

function filteredToday(entries: WaterLogEntry[]) {
  const today = dayKeyForIso(new Date().toISOString());
  return entries
    .filter((e) => dayKeyForIso(e.at) === today)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

const RING = 260;
const RING_STROKE = 11;

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

  const orderedPresets = useMemo(() => presetsByPrimaryThenRest(), []);
  const primary = orderedPresets.filter((p) => WATER_PRIMARY_PRESET_IDS.includes(p.id));
  const extra = orderedPresets.filter((p) => !WATER_PRIMARY_PRESET_IDS.includes(p.id));

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

  function renderPresetButton(preset: WaterPresetDef) {
    return (
      <GlassCard palette={palette} key={preset.id} style={[styles.glassPreset, styles.presetCell]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${formatVolume(preset.ml, unit)} (${preset.label})`}
          style={styles.presetInside}
          onPress={() => addWater(preset.ml, { presetId: preset.id })}>
          <View style={[styles.presetOrb, { backgroundColor: palette.secondaryFixed }]}>
            <FontAwesome name={preset.icon} size={26} color={palette.onSecondaryFixed} />
          </View>
          <Text style={[styles.presetTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.label }]}>
            {preset.label}
          </Text>
          <Text style={[styles.presetSub, { color: palette.outline }]}>
            {formatVolume(preset.ml, unit)}
          </Text>
        </Pressable>
      </GlassCard>
    );
  }

  return (
    <ScreenBackground palette={palette}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.pad}>
          <FastCoachHeader title="Fasting Tracker" palette={palette} />

          {/* Progress */}
          <View style={styles.centerCol}>
            <CircularRing
              size={RING}
              stroke={RING_STROKE}
              progress={progress}
              svgGradientId="fastCoachHydrationRing"
              trackColor={palette.surfaceContainerHigh}
              gradientStart={palette.secondaryContainer}
              gradientEnd={`${palette.secondaryContainer}66`}>
              <View style={[styles.innerDisc, { backgroundColor: `${palette.surfaceContainerLowest}E6` }]}>
                <Text
                  style={[
                    styles.pctHuge,
                    { color: palette.onSurface, fontFamily: FastCoachFonts.display },
                  ]}>
                  {pct}
                  <Text style={[styles.pctTiny, { color: palette.outline }]}>%</Text>
                </Text>
                <Text style={[styles.ringSub, { color: palette.onSurfaceVariant }]}>
                  {formatVolume(totalMl, unit)} / {formatVolume(goalMl, unit)}
                </Text>
              </View>
            </CircularRing>

            <Text style={[styles.motivate, { color: palette.onSurfaceVariant }]}>
              {pct >= 100 ? 'Hydration trophy unlocked for today!' : `You're on track — keep sipping toward your daily goal.`}
            </Text>
          </View>

          <Text style={[styles.sectionHd, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
            Quick add
          </Text>
          <View style={[styles.quickRow]}>{primary.map(renderPresetButton)}</View>

          {extra.length > 0 ? (
            <View style={[styles.secondaryGrid, { marginTop: 10 }]}>{extra.map(renderPresetButton)}</View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open custom water entry"
            onPress={() => {
              setCustomDraft('');
              setCustomOpen(true);
            }}
            style={({ pressed }) => [
              styles.customCta,
              {
                backgroundColor: palette.secondaryContainer,
                opacity: pressed ? 0.9 : 1,
                shadowColor: palette.secondary,
              },
            ]}>
            <MaterialCommunityIcons name="cup-water" color={palette.onSecondaryContainer} size={22} />
            <Text style={[styles.customCtaText, { color: palette.onSecondaryContainer }]}>
              Custom entry
            </Text>
          </Pressable>

          <View style={styles.logHeadingRow}>
            <Text style={[styles.sectionHd, { color: palette.onSurface }]}>{`Today's log`}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={editMode ? 'Finish editing hydration log' : 'Edit hydration log'}
              hitSlop={8}
              onPress={() => setEditMode((e) => !e)}>
              <Text style={[styles.editLink, { color: palette.secondary, fontFamily: FastCoachFonts.label }]}>
                {editMode ? 'Done' : 'Edit'}
              </Text>
            </Pressable>
          </View>

          <GlassCard palette={palette} style={{ padding: 0, overflow: 'hidden' }}>
            {log.length === 0 ? (
              <Text style={[styles.emptyLog, { color: palette.onSurfaceVariant }]}>
                No pours yet—tap a quick add tile or craft a custom amount.
              </Text>
            ) : (
              log.map((entry, idx) => (
                <View
                  key={entry.id}
                  style={[
                    styles.logRow,
                    idx !== log.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: palette.outlineVariant + 'AA',
                    },
                  ]}>
                  <View style={styles.logLeft}>
                    <View style={[styles.logOrb, { backgroundColor: `${palette.secondaryFixed}88` }]}>
                      <FontAwesome
                        name={WATER_PRESETS.find((p) => p.id === entry.presetId)?.icon ?? 'tint'}
                        size={18}
                        color={palette.onSecondaryFixed}
                      />
                    </View>
                    <View style={{ gap: 2 }}>
                      <Text style={[styles.logTitle, { color: palette.onSurface }]}>
                        {labelForPresetId(entry.presetId) ?? 'Custom pour'}
                      </Text>
                      <Text style={[styles.logTime, { color: palette.outline }]}>
                        {formatTimeOnly(entry.at)}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <Text style={[styles.logMl, { color: palette.onSurface }]}>{formatVolume(entry.ml, unit)}</Text>
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
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          color={palette.error}
                          size={22}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </GlassCard>
        </ScrollView>

        <Modal transparent visible={customOpen} animationType="fade" onRequestClose={() => setCustomOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCustomOpen(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: palette.surfaceContainerLowest }]} onPress={() => undefined}>
              <Text style={[styles.sheetTitle, { color: palette.onSurface }]}>Custom pour</Text>
              <Text style={{ color: palette.onSurfaceVariant, marginBottom: 10 }}>
                Enter amount in <Text style={{ fontWeight: '800' }}>{unit}</Text>, rounded for quick logging.
              </Text>
              <TextInput
                value={customDraft}
                onChangeText={setCustomDraft}
                keyboardType="decimal-pad"
                placeholder={`e.g. ${unit === 'oz' ? '12' : '400'}`}
                placeholderTextColor={palette.outline}
                style={[
                  styles.input,
                  {
                    borderColor: palette.outlineVariant,
                    color: palette.onSurface,
                  },
                ]}
              />
              <Pressable onPress={() => submitCustomPour()} style={[styles.sheetBtn, { backgroundColor: palette.primary }]}>
                <Text style={[styles.sheetBtnText, { color: palette.onPrimary }]}>Add to log</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: 'transparent' },
  pad: {
    paddingHorizontal: 22,
    paddingBottom: 120,
    gap: 14,
  },
  centerCol: { alignItems: 'center', marginTop: 4, gap: 8 },
  innerDisc: {
    width: RING - RING_STROKE * 2 - 36,
    height: RING - RING_STROKE * 2 - 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    gap: 4,
    paddingHorizontal: 6,
  },
  pctHuge: { fontVariant: ['tabular-nums'], fontSize: 48, letterSpacing: -1.8, fontWeight: '900' },
  pctTiny: { fontSize: 22, letterSpacing: 0, fontWeight: '800' },
  ringSub: { fontSize: 15, marginTop: 4, fontFamily: FastCoachFonts.body },
  motivate: {
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
    fontSize: 16,
    fontFamily: FastCoachFonts.bodyLight,
    marginTop: 4,
    marginBottom: 6,
  },
  sectionHd: { fontWeight: '800', letterSpacing: -0.2, fontSize: 22 },
  quickRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  secondaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' },
  glassPreset: { padding: 0 },
  presetCell: { flexGrow: 1, flexShrink: 1, flexBasis: '30%', minWidth: 98, maxWidth: 180 },
  presetInside: { paddingVertical: 16, paddingHorizontal: 8, gap: 6, alignItems: 'center', justifyContent: 'center' },
  presetOrb: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  presetTitle: { fontSize: 14, letterSpacing: 0.06 * 13, textAlign: 'center' },
  presetSub: { fontSize: 11, letterSpacing: 1.8, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  customCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 6,
    marginBottom: 4,
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  customCtaText: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  logHeadingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  editLink: { fontSize: 14, letterSpacing: 0.06 * 11, fontWeight: '700' },
  emptyLog: { padding: 18, fontSize: 14, fontFamily: FastCoachFonts.body },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  logLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logOrb: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  logTitle: { fontWeight: '700', fontSize: 15 },
  logTime: { fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  logMl: { fontSize: 18, letterSpacing: -0.2, fontVariant: ['tabular-nums'], fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,21,48,0.35)',
    padding: 22,
    paddingBottom: 40,
  },
  sheet: {
    borderRadius: 26,
    padding: 22,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#fff4',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    shadowOffset: { width: 0, height: -4 },
    shadowColor: '#000',
  },
  sheetTitle: { fontSize: 21, fontWeight: '900', letterSpacing: -0.35 },
  input: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, fontSize: 18 },
  sheetBtn: { borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  sheetBtnText: { fontWeight: '800', fontSize: 16 },
});
