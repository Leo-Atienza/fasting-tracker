import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FastCoachFonts,
  FastCoachPalette,
  type ColorSchemeName,
  type FastCoachPalette as CoachPaletteColors,
} from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { FixedTopBar, FIXED_TOP_BAR_HEIGHT } from '@/src/components/fastCoach/FixedTopBar';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { ScalePressable } from '@/src/components/fastCoach/ScalePressable';
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
  shadow?: string;
};

function outcomeBadge(session: FastSession, durMs: number, palette: CoachPaletteColors): OutcomeBadge {
  const durMin = durMs / (60 * 1000);
  const target = session.targetDurationMinutes;

  if (target == null) {
    return {
      label: 'FLEXIBLE FINISH',
      icon: 'infinity',
      bg: `${palette.surfaceVariant}DD`,
      fg: palette.onSurfaceVariant,
    };
  }
  if (durMin < target - 0.001) {
    return {
      label: 'MISSED GOAL',
      icon: 'minus-circle-outline',
      bg: `${palette.surfaceVariant}DD`,
      fg: palette.onSurfaceVariant,
    };
  }
  if (durMin >= target * 1.08) {
    return {
      label: 'OVERACHIEVER',
      icon: 'fire',
      bg: palette.primaryContainer,
      fg: palette.onPrimaryContainer,
      shadow: palette.primaryFixedDim,
    };
  }
  return {
    label: 'GOAL MET',
    icon: 'check-circle',
    bg: palette.primaryContainer,
    fg: palette.onPrimaryContainer,
    shadow: palette.primaryFixedDim,
  };
}

export default function HistoryScreen() {
  const router = useRouter();
  const sessions = useAppStore((s) => s.sessions);
  const removeFastSession = useAppStore((s) => s.removeFastSession);
  const scheme = (useColorScheme() ?? 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];
  const [visibleCount, setVisibleCount] = useState(PAGE);

  function confirmRemove(item: FastSession) {
    Alert.alert(
      'Remove this fast?',
      'It will disappear from history. This cannot be undone.',
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFastSession(item.id) },
      ],
    );
  }

  const sorted = sortedSessionsDescending(sessions);
  const viewport = sorted.slice(0, visibleCount);
  const hasMore = sorted.length > visibleCount;

  function parseDur(item: FastSession): number {
    const start = Date.parse(item.startedAt);
    const end = Date.parse(item.endedAt);
    return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : 0;
  }

  function renderRow({ item }: { item: FastSession }) {
    const dur = parseDur(item);
    const badge = outcomeBadge(item, dur, palette);
    const heading = relativeDayHeading(item.endedAt);
    const dimmed = badge.label === 'MISSED GOAL';

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${badge.label} fast, ${formatElapsedShort(dur)}, ${heading}`}
        accessibilityHint="Long-press to remove this fast from history."
        onLongPress={() => confirmRemove(item)}
        delayLongPress={350}
        style={{ marginBottom: 14 }}>
        <GlassCard
          palette={palette}
          radius={24}
          tone={dimmed ? 'low' : 'high'}
          style={[styles.card, dimmed && { opacity: 0.85 }]}>
          <View style={[styles.cardBlob, { backgroundColor: dimmed ? `${palette.outlineVariant}33` : `${palette.primaryFixed}55` }]} />
          <View style={styles.cardTop}>
            <View>
              <Text style={[styles.dayEyebrow, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
                {heading.toUpperCase()}
              </Text>
              <Text style={[styles.duration, { color: palette.onSurface, fontFamily: FastCoachFonts.display }]}>
                {formatElapsedShort(dur)}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: badge.bg,
                  ...(badge.shadow && {
                    shadowColor: badge.shadow,
                    shadowOpacity: 0.55,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 4,
                  }),
                },
              ]}>
              <MaterialCommunityIcons name={badge.icon} size={14} color={badge.fg} />
              <Text style={[styles.badgeText, { color: badge.fg, fontFamily: FastCoachFonts.label }]}>
                {badge.label}
              </Text>
            </View>
          </View>
          <View style={[styles.cardBottom, { borderTopColor: `${palette.outlineVariant}66` }]}>
            <Metric
              label="START"
              value={formatTimeOnly(item.startedAt)}
              labelColor={palette.outline}
              valueColor={palette.onSurfaceVariant}
            />
            <Metric
              label="END"
              value={formatTimeOnly(item.endedAt)}
              labelColor={palette.outline}
              valueColor={palette.onSurfaceVariant}
            />
          </View>
        </GlassCard>
      </Pressable>
    );
  }

  return (
    <ScreenBackground palette={palette} accent="history">
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <FixedTopBar
          title="Fast Coach"
          palette={palette}
          isDark={scheme === 'dark'}
          showHistory={false}
          rightAccessory={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={10}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
              <MaterialCommunityIcons name="close" size={22} color={palette.onSurfaceVariant} />
            </Pressable>
          }
          hideRight={false}
        />
        {sessions.length === 0 ? (
          <View style={[styles.empty, { paddingTop: FIXED_TOP_BAR_HEIGHT + 80 }]}>
            <MaterialCommunityIcons name="calendar-clock" size={48} color={palette.outline} />
            <Text style={[styles.emptyTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
              No completed fasts yet
            </Text>
            <Text style={[styles.emptySub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
              End a fast from the Fast tab — we chart it here instantly.
            </Text>
          </View>
        ) : (
          <FlatList
            data={viewport}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingTop: FIXED_TOP_BAR_HEIGHT + 18 }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={[styles.title, { color: palette.primary, fontFamily: FastCoachFonts.headlineLg }]}>
                  History
                </Text>
                <Text style={[styles.subtitle, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
                  Your recent fasting milestones.
                </Text>
              </View>
            }
            renderItem={renderRow}
            ListFooterComponent={
              hasMore ? (
                <ScalePressable
                  accessibilityRole="button"
                  accessibilityLabel="Load older fasts"
                  onPress={() => setVisibleCount((c) => c + PAGE)}
                  scaleTo={0.985}>
                  <View style={[styles.loadMore, { backgroundColor: `${palette.surfaceContainerHigh}DD` }]}>
                    <Text style={[styles.loadMoreText, { color: palette.primary, fontFamily: FastCoachFonts.headlineMd }]}>
                      Load More
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={22} color={palette.primary} />
                  </View>
                </ScalePressable>
              ) : (
                <View style={{ height: 24 }} />
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
    <View style={{ gap: 4, marginRight: 40 }}>
      <Text style={[styles.metricLabel, { color: labelColor, fontFamily: FastCoachFonts.label }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: valueColor, fontFamily: FastCoachFonts.body }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: 22, paddingBottom: 36 },
  listHeader: { marginBottom: 14, gap: 6 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  card: { padding: 20, overflow: 'hidden', position: 'relative', gap: 16 },
  cardBlob: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    top: -50,
    right: -40,
    opacity: 0.7,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dayEyebrow: { fontSize: 11, letterSpacing: 1.8, fontWeight: '800', marginBottom: 4 },
  duration: { fontSize: 30, fontWeight: '800', letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontSize: 10, letterSpacing: 1.4, fontWeight: '800' },
  cardBottom: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  metricLabel: { fontSize: 11, letterSpacing: 1.6, fontWeight: '800' },
  metricValue: { fontSize: 15 },
  loadMore: {
    marginTop: 12,
    borderRadius: 999,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadMoreText: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 22, textAlign: 'center', fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
