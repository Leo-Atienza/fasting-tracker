import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FastCoachFonts,
  FastCoachPalette,
  type ColorSchemeName,
  type FastCoachPalette as CoachPaletteColors,
} from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
import type { FastSession } from '@/src/domain/types';
import { formatElapsedShort, formatTimeOnly, relativeDayHeading } from '@/src/lib/time';
import { sortedSessionsDescending } from '@/src/store/selectors';
import { useAppStore } from '@/src/store/useAppStore';

const PAGE = 7;

type OutcomeBadge = {
  label: string;
  icon: 'check-circle' | 'fire' | 'minus-circle-outline' | 'infinity';
  bg: string;
  fg: string;
};

/** Maps session outcome to pill visuals (educational, not judgmental). */
function outcomeBadge(session: FastSession, durMs: number, palette: CoachPaletteColors): OutcomeBadge {
  const durMin = durMs / (60 * 1000);
  const target = session.targetDurationMinutes;

  if (target == null) {
    return {
      label: 'Flexible finish',
      icon: 'infinity',
      bg: `${palette.surfaceVariant}CC`,
      fg: palette.onSurfaceVariant,
    };
  }

  if (durMin < target - 0.001) {
    return {
      label: 'Missed goal',
      icon: 'minus-circle-outline',
      bg: `${palette.surfaceVariant}BB`,
      fg: palette.onSurfaceVariant,
    };
  }

  if (durMin >= target * 1.08) {
    return {
      label: 'Overachiever',
      icon: 'fire',
      bg: palette.primaryContainer,
      fg: palette.onPrimaryContainer,
    };
  }

  return {
    label: 'Goal met',
    icon: 'check-circle',
    bg: palette.primaryContainer,
    fg: palette.onPrimaryContainer,
  };
}

function durationMinutes(durMs: number): number {
  return Math.floor(durMs / (60 * 1000));
}

export default function HistoryScreen() {
  const sessions = useAppStore((s) => s.sessions);
  const scheme = (useColorScheme() ?? 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];
  const [visibleCount, setVisibleCount] = useState(PAGE);

  const sorted = sortedSessionsDescending(sessions);
  const viewport = sorted.slice(0, visibleCount);
  const hasMore = sorted.length > visibleCount;

  const emptyCopy = useMemo(
    () => ({
      headline: 'No completed fasts yet',
      hint: 'End a fast from the Fast tab — we chart it here instantly.',
    }),
    [],
  );

  function parseDur(item: FastSession): number {
    const start = Date.parse(item.startedAt);
    const end = Date.parse(item.endedAt);
    return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : 0;
  }

  function renderRow({ item }: { item: FastSession }) {
    const dur = parseDur(item);
    const badge = outcomeBadge(item, dur, palette);
    const heading = relativeDayHeading(item.endedAt);
    const subdued = badge.label === 'Missed goal' ? { opacity: 0.92 } : undefined;

    return (
      <GlassCard
        palette={palette}
        style={[styles.card, subdued]}>
        <View style={[styles.blob, { backgroundColor: `${palette.primaryContainer}44` }]} />
        <View style={styles.rowTop}>
          <View>
            <Text style={[styles.dayEyebrow, { color: palette.outline }]}>
              {heading.toUpperCase()}
            </Text>
            <Text
              style={[
                styles.durHuge,
                { color: palette.onSurface, fontFamily: FastCoachFonts.display },
              ]}>
              {formatElapsedShort(dur)}
            </Text>
            <Text style={[styles.clockHint, { color: palette.onSurfaceVariant }]}>
              {`${durationMinutes(dur)} min total`}
            </Text>
          </View>
          <View style={[styles.badgeRow, { backgroundColor: badge.bg }]}>
            <MaterialCommunityIcons name={badge.icon} size={17} color={badge.fg} />
            <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.label}</Text>
          </View>
        </View>
        <View style={[styles.rowBottom, { borderTopColor: `${palette.outlineVariant}AA` }]}>
          <Metric
            label="START"
            labelColor={palette.outline}
            valueColor={palette.onSurfaceVariant}
            value={formatTimeOnly(item.startedAt)}
          />
          <Metric
            label="END"
            labelColor={palette.outline}
            valueColor={palette.onSurfaceVariant}
            value={formatTimeOnly(item.endedAt)}
          />
        </View>
      </GlassCard>
    );
  }

  return (
    <ScreenBackground palette={palette}>
      <SafeAreaView style={styles.flex} edges={[]}>
        {sessions.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="calendar-clock" size={46} color={palette.outline} />
            <Text style={[styles.emptyTitle, { color: palette.onSurface }]}>{emptyCopy.headline}</Text>
            <Text style={[styles.emptySub, { color: palette.onSurfaceVariant }]}>{emptyCopy.hint}</Text>
          </View>
        ) : (
          <FlatList
            data={viewport}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={{ marginBottom: 16, gap: 8 }}>
                <Text style={[styles.headline, { color: palette.primary, fontFamily: FastCoachFonts.display }]}>
                  History
                </Text>
                <Text style={[styles.sub, { color: palette.onSurfaceVariant }]}>
                  Your recent fasting milestones — tap the back arrow to return to coaching.
                </Text>
              </View>
            }
            renderItem={renderRow}
            ListFooterComponent={
              hasMore ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Load older fasts"
                  onPress={() => setVisibleCount((c) => c + PAGE)}
                  style={({ pressed }) => [
                    styles.loadMore,
                    {
                      backgroundColor: `${palette.surfaceContainerHigh}EE`,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}>
                  <Text style={[styles.loadMoreText, { color: palette.primary }]}>Load more</Text>
                  <MaterialCommunityIcons name="chevron-down" size={22} color={palette.primary} />
                </Pressable>
              ) : (
                <View style={{ height: 18 }} />
              )
            }
          />
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}

function Metric({
  label,
  value,
  labelColor,
  valueColor,
}: {
  label: string;
  value: string;
  labelColor: string;
  valueColor: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={[styles.metricLabel, { color: labelColor }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: 'transparent' },
  list: { paddingHorizontal: 22, paddingBottom: 36, paddingTop: 8 },
  headline: { fontSize: 36, letterSpacing: -1.4, lineHeight: 40 },
  sub: { fontSize: 16, lineHeight: 24, fontFamily: FastCoachFonts.bodyLight },
  card: {
    padding: 20,
    overflow: 'hidden',
    borderRadius: 20,
    gap: 16,
    marginBottom: 16,
  },
  blob: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    top: -40,
    right: -50,
    opacity: 0.8,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  dayEyebrow: {
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    fontFamily: FastCoachFonts.label,
  },
  durHuge: { fontSize: 30, letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  clockHint: { fontSize: 13, marginTop: 4, fontFamily: FastCoachFonts.body },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '800',
    textTransform: 'uppercase',
    fontFamily: FastCoachFonts.label,
  },
  rowBottom: {
    flexDirection: 'row',
    gap: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
  },
  metricLabel: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '800',
    textTransform: 'uppercase',
    fontFamily: FastCoachFonts.label,
  },
  metricValue: { fontSize: 15, fontFamily: FastCoachFonts.body },
  loadMore: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadMoreText: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptySub: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
