import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FastCoachFonts,
  FastCoachPalette,
  type ColorSchemeName,
  type FastCoachPalette as FastCoachPaletteColors,
} from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { FixedTopBar, useTopBarOffset } from '@/src/components/fastCoach/FixedTopBar';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
import { SectionLabel } from '@/src/components/fastCoach/SectionLabel';
import { computeInsights, streakProgress } from '@/src/features/insights/computeInsights';
import { formatElapsedShort } from '@/src/lib/time';
import { formatVolume } from '@/src/lib/units';
import { useAppStore } from '@/src/store/useAppStore';

const STREAK_TARGET_OPTIONS: readonly number[] = [7, 14, 30];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function todayWeekdayShortNames(now: Date): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const monFirst = (d.getDay() + 6) % 7;
    out.push(DAY_LABELS[monFirst] ?? '');
  }
  return out;
}

export default function InsightsScreen() {
  const scheme = (useColorScheme() ?? 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];
  const topBarOffset = useTopBarOffset();

  const sessions = useAppStore((s) => s.sessions);
  const waterEntries = useAppStore((s) => s.waterEntries);
  const waterUnit = useAppStore((s) => s.waterUnit);
  const goalMl = useAppStore((s) => s.waterDailyGoalMl);
  const streakTargetDays = useAppStore((s) => s.streakTargetDays);
  const setStreakTargetDays = useAppStore((s) => s.setStreakTargetDays);

  const snapshot = useMemo(
    () => computeInsights(sessions, waterEntries, new Date()),
    [sessions, waterEntries],
  );
  const dayLabels = useMemo(() => todayWeekdayShortNames(new Date()), []);

  const waterPeak = Math.max(goalMl, ...snapshot.water7d, 1);
  const fastsPeak = Math.max(1, ...snapshot.fasts7d);
  const empty = snapshot.totalFasts === 0;

  const progress = useMemo(
    () => streakProgress(snapshot.streakDays, streakTargetDays),
    [snapshot.streakDays, streakTargetDays],
  );
  const monthly = snapshot.monthly;
  const monthlyPeak = Math.max(1, ...monthly.fastsPerDay);

  return (
    <ScreenBackground palette={palette} accent="insights">
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <FixedTopBar title="Insights" palette={palette} isDark={scheme === 'dark'} />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topBarOffset + 20 }]}
          showsVerticalScrollIndicator={false}>
          <SectionLabel palette={palette} tone="primary">YOUR WEEKLY VIEW</SectionLabel>

          {/* Streak hero */}
          <GlassCard palette={palette} radius={26} tone="high" style={styles.streakCard}>
            <View style={[styles.streakBlob, { backgroundColor: `${palette.primaryFixed}55` }]} pointerEvents="none" />
            <View style={[styles.streakIcon, { backgroundColor: `${palette.primaryContainer}33` }]}>
              <MaterialCommunityIcons
                name={snapshot.streakDays > 0 ? 'fire' : 'play-circle-outline'}
                size={28}
                color={palette.primary}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.streakEyebrow, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
                {snapshot.streakDays > 0 ? 'CURRENT STREAK' : 'STREAK WAITING ON YOU'}
              </Text>
              <Text style={[styles.streakValue, { color: palette.onSurface, fontFamily: FastCoachFonts.display }]}>
                {snapshot.streakDays > 0
                  ? `${snapshot.streakDays} ${snapshot.streakDays === 1 ? 'day' : 'days'}`
                  : 'Start today'}
              </Text>
              <Text style={[styles.streakSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                {snapshot.streakDays > 1
                  ? 'Consecutive days with at least one completed fast.'
                  : snapshot.streakDays === 1
                  ? 'Nice — keep it going tomorrow.'
                  : 'A streak begins after your first completed fast.'}
              </Text>
            </View>
          </GlassCard>

          {/* Streak goal card */}
          <GlassCard palette={palette} radius={22} tone="mid" style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={[styles.goalEyebrow, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
                STREAK GOAL
              </Text>
              <Text style={[styles.goalSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                {streakTargetDays == null
                  ? 'Pick a target to chase.'
                  : progress.remaining === 0
                  ? 'Target met — pick a new one to push further.'
                  : `${progress.remaining} ${progress.remaining === 1 ? 'day' : 'days'} to go`}
              </Text>
            </View>
            <View style={styles.chipRow}>
              {STREAK_TARGET_OPTIONS.map((d) => {
                const sel = streakTargetDays === d;
                return (
                  <Pressable
                    key={d}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: sel }}
                    accessibilityLabel={`Set streak goal to ${d} days`}
                    onPress={() => setStreakTargetDays(sel ? null : d)}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: sel ? palette.primary : `${palette.surfaceContainerLow}EE`,
                        borderColor: sel ? palette.primary : palette.glassBorder,
                        opacity: pressed ? 0.86 : 1,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.chipLabel,
                        {
                          color: sel ? palette.onPrimary : palette.onSurfaceVariant,
                          fontFamily: FastCoachFonts.label,
                        },
                      ]}>
                      {d}-DAY
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {streakTargetDays != null && snapshot.streakDays > 0 ? (
              <View
                style={[styles.progressTrack, { backgroundColor: `${palette.primaryContainer}AA` }]}
                accessibilityRole="progressbar"
                accessibilityValue={{ now: Math.round(progress.ratio * 100), min: 0, max: 100 }}
                accessibilityLabel="Streak progress toward your goal">
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(progress.ratio * 100)}%`, backgroundColor: palette.primary },
                  ]}
                />
              </View>
            ) : null}
          </GlassCard>

          {/* Bento metrics */}
          <View style={styles.tileRow}>
            <Tile
              palette={palette}
              eyebrow="TOTAL FASTS"
              value={String(snapshot.totalFasts)}
              icon="checkbox-multiple-marked-outline"
              accent={palette.primary}
            />
            <Tile
              palette={palette}
              eyebrow="AVG LENGTH"
              value={empty ? '—' : formatElapsedShort(snapshot.averageDurationMs)}
              icon="chart-bell-curve"
              accent={palette.secondary}
            />
            <Tile
              palette={palette}
              eyebrow="LONGEST"
              value={empty ? '—' : formatElapsedShort(snapshot.longestMs)}
              icon="trophy-outline"
              accent={palette.tertiary}
            />
          </View>

          {/* Water chart */}
          <GlassCard palette={palette} radius={26} style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartEyebrow, { color: palette.secondary, fontFamily: FastCoachFonts.label }]}>
                HYDRATION · LAST 7 DAYS
              </Text>
              <Text style={[styles.chartLegend, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                Goal {formatVolume(goalMl, waterUnit)}
              </Text>
            </View>
            <View style={styles.bars} accessibilityRole="image" accessibilityLabel="Bar chart of daily water intake over the last 7 days">
              {snapshot.water7d.map((ml, i) => {
                const met = ml >= goalMl && goalMl > 0;
                const heightPct = waterPeak > 0 ? Math.max(2, (ml / waterPeak) * 100) : 2;
                return (
                  <View key={`w-${i}`} style={styles.barCell}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${heightPct}%`,
                            backgroundColor: met ? palette.secondary : `${palette.secondaryContainer}77`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
                      {dayLabels[i] ?? ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>

          {/* Fasts chart */}
          <GlassCard palette={palette} radius={26} style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartEyebrow, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
                FASTS · LAST 7 DAYS
              </Text>
              <Text style={[styles.chartLegend, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                {empty ? 'No fasts yet' : `${snapshot.fasts7d.reduce((a, b) => a + b, 0)} this week`}
              </Text>
            </View>
            <View style={styles.bars}>
              {snapshot.fasts7d.map((n, i) => {
                const heightPct = fastsPeak > 0 ? Math.max(2, (n / fastsPeak) * 100) : 2;
                return (
                  <View key={`f-${i}`} style={styles.barCell}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${heightPct}%`,
                            backgroundColor: n > 0 ? palette.primary : `${palette.primaryContainer}55`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
                      {dayLabels[i] ?? ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>

          {/* Monthly summary */}
          <SectionLabel palette={palette} tone="primary">THIS MONTH</SectionLabel>
          <GlassCard palette={palette} radius={22} style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartEyebrow, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
                {monthly.monthLabel.toUpperCase()}
              </Text>
              <Text style={[styles.chartLegend, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                {monthly.totalFasts === 0
                  ? 'No fasts this month yet'
                  : `${monthly.totalFasts} fasts logged`}
              </Text>
            </View>
            <View style={styles.monthlyRow}>
              <MonthlyTile
                palette={palette}
                eyebrow="FASTS"
                value={String(monthly.totalFasts)}
                accent={palette.primary}
              />
              <MonthlyTile
                palette={palette}
                eyebrow="HOURS"
                value={formatHoursTotal(monthly.totalFastedMs)}
                accent={palette.secondary}
              />
              <MonthlyTile
                palette={palette}
                eyebrow="LONGEST"
                value={monthly.longestMs === 0 ? '—' : formatElapsedShort(monthly.longestMs)}
                accent={palette.tertiary}
              />
              <MonthlyTile
                palette={palette}
                eyebrow="AVG"
                value={monthly.averageDurationMs === 0 ? '—' : formatElapsedShort(monthly.averageDurationMs)}
                accent={palette.primary}
              />
            </View>
            <View style={styles.heatmap} accessibilityRole="image" accessibilityLabel={`Mini bar chart of fasts per day for ${monthly.monthLabel}`}>
              {monthly.fastsPerDay.map((count, i) => {
                const heightPct = monthlyPeak > 0 ? Math.max(8, (count / monthlyPeak) * 100) : 8;
                const bg = count > 0 ? palette.primary : `${palette.outlineVariant}55`;
                return (
                  <View key={`m-${i}`} style={styles.heatCell}>
                    <View style={[styles.heatBar, { height: `${heightPct}%`, backgroundColor: bg }]} />
                  </View>
                );
              })}
            </View>
          </GlassCard>

          {empty ? (
            <Text style={[styles.emptyHint, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
              Complete your first fast on the Fast tab and stats start appearing here automatically.
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function formatHoursTotal(ms: number): string {
  if (ms <= 0) return '0h';
  const hours = Math.round(ms / (60 * 60 * 1000));
  return `${hours}h`;
}

function MonthlyTile({
  palette,
  eyebrow,
  value,
  accent,
}: {
  palette: FastCoachPaletteColors;
  eyebrow: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={[styles.monthlyTile, { backgroundColor: `${accent}11`, borderColor: `${accent}33` }]}>
      <Text style={[styles.monthlyEyebrow, { color: accent, fontFamily: FastCoachFonts.label }]}>
        {eyebrow}
      </Text>
      <Text style={[styles.monthlyValue, { color: palette.onSurface, fontFamily: FastCoachFonts.display }]}>
        {value}
      </Text>
    </View>
  );
}

function Tile({
  palette,
  eyebrow,
  value,
  icon,
  accent,
}: {
  palette: FastCoachPaletteColors;
  eyebrow: string;
  value: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  accent: string;
}) {
  return (
    <GlassCard palette={palette} radius={22} style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: `${accent}1A` }]}>
        <MaterialCommunityIcons name={icon} size={20} color={accent} />
      </View>
      <Text style={[styles.tileEyebrow, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
        {eyebrow}
      </Text>
      <Text style={[styles.tileValue, { color: palette.onSurface, fontFamily: FastCoachFonts.display }]}>
        {value}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingBottom: 140, gap: 14 },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  streakBlob: { position: 'absolute', top: -50, right: -40, width: 160, height: 160, borderRadius: 999 },
  streakIcon: { width: 56, height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  streakEyebrow: { fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: '800' },
  streakValue: { fontSize: 28, letterSpacing: -0.5, fontWeight: '800' },
  streakSub: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  tileRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  tile: { flex: 1, padding: 14, gap: 6 },
  tileIcon: { width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  tileEyebrow: { fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '800', marginTop: 4 },
  tileValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  chartCard: { padding: 20, gap: 14 },
  chartHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  chartEyebrow: { fontSize: 11, letterSpacing: 1.6, fontWeight: '800' },
  chartLegend: { fontSize: 12 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 8 },
  barCell: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { width: '100%', flex: 1, justifyContent: 'flex-end', borderRadius: 6, overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  emptyHint: { marginTop: 4, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  goalCard: { padding: 18, gap: 12 },
  goalHeader: { gap: 4 },
  goalEyebrow: { fontSize: 11, letterSpacing: 1.6, fontWeight: '800' },
  goalSub: { fontSize: 13, lineHeight: 18 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: { height: '100%', borderRadius: 999 },
  monthlyRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  monthlyTile: {
    flexBasis: '47%',
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  monthlyEyebrow: { fontSize: 10, letterSpacing: 1.4, fontWeight: '800' },
  monthlyValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  heatmap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 48,
    gap: 2,
    marginTop: 4,
  },
  heatCell: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  heatBar: { width: '100%', borderRadius: 2 },
});
