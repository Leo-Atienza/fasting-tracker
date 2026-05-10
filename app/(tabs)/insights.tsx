import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FastCoachFonts,
  FastCoachPalette,
  type ColorSchemeName,
  type FastCoachPalette as FastCoachPaletteColors,
} from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { FastCoachHeader } from '@/src/components/fastCoach/FastCoachHeader';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
import { computeInsights } from '@/src/features/insights/computeInsights';
import { formatElapsedShort } from '@/src/lib/time';
import { formatVolume } from '@/src/lib/units';
import { useAppStore } from '@/src/store/useAppStore';

const DAY_LABELS_OFFSET = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function todayWeekdayShortNames(now: Date): string[] {
  // Returns 7 short weekday names (Sun..Sat indexed) ordered oldest -> today,
  // mirroring the `last7Days*` selectors.
  const out: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const idx = d.getDay(); // 0 = Sun
    // Use Mon-first lookup: 0(Sun)->6, 1(Mon)->0, ... 6(Sat)->5
    const monFirst = (idx + 6) % 7;
    out.push(DAY_LABELS_OFFSET[monFirst] ?? '');
  }
  return out;
}

export default function InsightsScreen() {
  const scheme = (useColorScheme() ?? 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];

  const sessions = useAppStore((s) => s.sessions);
  const waterEntries = useAppStore((s) => s.waterEntries);
  const waterUnit = useAppStore((s) => s.waterUnit);
  const goalMl = useAppStore((s) => s.waterDailyGoalMl);

  const snapshot = useMemo(() => computeInsights(sessions, waterEntries, new Date()), [sessions, waterEntries]);
  const dayLabels = useMemo(() => todayWeekdayShortNames(new Date()), []);

  const waterPeak = Math.max(goalMl, ...snapshot.water7d, 1);
  const fastsPeak = Math.max(1, ...snapshot.fasts7d);

  const empty = snapshot.totalFasts === 0;

  return (
    <ScreenBackground palette={palette}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.pad}>
          <FastCoachHeader title="Insights" palette={palette} />

          {/* Streak ribbon */}
          <GlassCard palette={palette} style={[styles.streakCard, { borderColor: palette.glassBorder }]}>
            <View style={[styles.streakIcon, { backgroundColor: `${palette.primaryContainer}33` }]}>
              <MaterialCommunityIcons
                name={snapshot.streakDays > 0 ? 'fire' : 'play-circle-outline'}
                size={28}
                color={palette.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.streakEyebrow, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
                {snapshot.streakDays > 0 ? 'Current streak' : 'Streak waiting on you'}
              </Text>
              <Text style={[styles.streakValue, { color: palette.onSurface, fontFamily: FastCoachFonts.display }]}>
                {snapshot.streakDays > 0
                  ? `${snapshot.streakDays} ${snapshot.streakDays === 1 ? 'day' : 'days'}`
                  : 'Start today'}
              </Text>
              <Text style={[styles.streakSub, { color: palette.onSurfaceVariant }]}>
                {snapshot.streakDays > 1
                  ? 'Consecutive days with at least one completed fast.'
                  : snapshot.streakDays === 1
                  ? 'Nice — keep it going tomorrow.'
                  : 'A streak begins after your first completed fast.'}
              </Text>
            </View>
          </GlassCard>

          {/* Stat tiles */}
          <View style={styles.tileRow}>
            <StatTile
              palette={palette}
              eyebrow="Total fasts"
              value={String(snapshot.totalFasts)}
              icon="checkbox-multiple-marked-outline"
            />
            <StatTile
              palette={palette}
              eyebrow="Avg length"
              value={empty ? '—' : formatElapsedShort(snapshot.averageDurationMs)}
              icon="chart-bell-curve"
            />
            <StatTile
              palette={palette}
              eyebrow="Longest"
              value={empty ? '—' : formatElapsedShort(snapshot.longestMs)}
              icon="trophy-outline"
            />
          </View>

          {/* Water sparkline */}
          <GlassCard palette={palette} style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartEyebrow, { color: palette.secondary, fontFamily: FastCoachFonts.label }]}>
                Hydration · last 7 days
              </Text>
              <Text style={[styles.chartLegend, { color: palette.onSurfaceVariant }]}>
                Goal: {formatVolume(goalMl, waterUnit)}
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
                            backgroundColor: met ? palette.secondary : `${palette.secondaryContainer}AA`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: palette.outline }]}>{dayLabels[i] ?? ''}</Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>

          {/* Fasts-per-day sparkline */}
          <GlassCard palette={palette} style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartEyebrow, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
                Fasts completed · last 7 days
              </Text>
              <Text style={[styles.chartLegend, { color: palette.onSurfaceVariant }]}>
                {empty ? 'No fasts yet' : `${snapshot.fasts7d.reduce((a, b) => a + b, 0)} this week`}
              </Text>
            </View>
            <View style={styles.bars} accessibilityRole="image" accessibilityLabel="Bar chart of fasts completed each day over the last 7 days">
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
                            backgroundColor: n > 0 ? palette.primary : `${palette.primaryContainer}66`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: palette.outline }]}>{dayLabels[i] ?? ''}</Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>

          {empty ? (
            <Text style={[styles.emptyHint, { color: palette.onSurfaceVariant }]}>
              Complete your first fast on the Fast tab and stats start appearing here automatically.
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function StatTile({
  palette,
  eyebrow,
  value,
  icon,
}: {
  palette: FastCoachPaletteColors;
  eyebrow: string;
  value: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}) {
  return (
    <GlassCard palette={palette} style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: `${palette.primaryContainer}22` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={palette.primary} />
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
  flex: { flex: 1, backgroundColor: 'transparent' },
  pad: { paddingHorizontal: 22, paddingBottom: 140, gap: 16 },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
    borderRadius: 26,
  },
  streakIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakEyebrow: {
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  streakSub: {
    fontSize: 13,
    marginTop: 4,
    fontFamily: FastCoachFonts.body,
    lineHeight: 18,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    padding: 14,
    gap: 8,
    borderRadius: 20,
    alignItems: 'flex-start',
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileEyebrow: {
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  tileValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  chartCard: {
    padding: 18,
    gap: 14,
    borderRadius: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  chartEyebrow: {
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  chartLegend: {
    fontSize: 12,
    fontFamily: FastCoachFonts.body,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 8,
  },
  barCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barTrack: {
    width: '100%',
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 6,
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptyHint: {
    marginTop: 4,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FastCoachFonts.body,
  },
});
