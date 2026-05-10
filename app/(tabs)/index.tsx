import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FastCoachFonts, FastCoachPalette, type ColorSchemeName } from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { CircularRing } from '@/src/components/fastCoach/CircularRing';
import { FastCoachHeader } from '@/src/components/fastCoach/FastCoachHeader';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
import { EatSuggestionsCard } from '@/src/components/EatSuggestionsCard';
import type { EatPhase } from '@/src/domain/types';
import { pickEatSuggestions } from '@/src/features/eat/selectSuggestions';
import { getFastingStage } from '@/src/features/fast/fastingStage';
import { formatElapsed, formatElapsedShort, formatTargetHm } from '@/src/lib/time';
import { useAppStore } from '@/src/store/useAppStore';

function formatTargetLabel(minutes: number): string {
  if (minutes % 60 === 0 && minutes >= 120) return `${minutes / 60} hours`;
  if (minutes % 60 === 0 && minutes === 60) return '1 hour';
  return `${minutes} minutes`;
}

const TARGET_CHOICES: { label: string; minutes: number | null }[] = [
  { label: 'Open', minutes: null },
  { label: '12 h', minutes: 12 * 60 },
  { label: '14 h', minutes: 14 * 60 },
  { label: '16 h', minutes: 16 * 60 },
  { label: '18 h', minutes: 18 * 60 },
  { label: '24 h', minutes: 24 * 60 },
];

const RING = 268;
const RING_STROKE = 10;

export default function FastHomeScreen() {
  const scheme = (useColorScheme() ?? 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];
  const { width } = useWindowDimensions();
  const gutter = Math.min(26, Math.max(18, Math.round(width * 0.06)));

  const activeFast = useAppStore((s) => s.activeFast);
  const startFast = useAppStore((s) => s.startFast);
  const endFast = useAppStore((s) => s.endFast);
  const dietPreferenceId = useAppStore((s) => s.dietPreferenceId);
  const shuffleNonce = useAppStore((s) => s.eatShuffleNonce);
  const bumpSuggestionShuffle = useAppStore((s) => s.bumpSuggestionShuffle);

  const [now, setNow] = useState(() => Date.now());
  const [targetChoice, setTargetChoice] =
    useState<(typeof TARGET_CHOICES)[number]>(TARGET_CHOICES[0] ?? { label: 'Open', minutes: null });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = useMemo(() => {
    if (!activeFast) return 0;
    return now - Date.parse(activeFast.startedAt);
  }, [activeFast, now]);

  const eats = useMemo(() => {
    const phases: EatPhase[] =
      activeFast != null ? ['during_fast'] : ['break_fast', 'eating_window'];
    return pickEatSuggestions(phases, dietPreferenceId, shuffleNonce, 2);
  }, [activeFast, dietPreferenceId, shuffleNonce]);

  const targetMs =
    activeFast?.targetDurationMinutes != null ? activeFast.targetDurationMinutes * 60 * 1000 : null;

  const ringProgress =
    targetMs != null && targetMs > 0 ? Math.min(1, elapsedMs / targetMs) : activeFast ? 0 : 0;

  const stage = getFastingStage(elapsedMs, Boolean(activeFast));
  const eatTitle = activeFast != null ? 'Next meal ideas' : 'Ideas between fasts';

  function confirmStart() {
    if (activeFast) return;
    startFast({
      targetDurationMinutes: targetChoice.minutes ?? null,
    });
  }

  function confirmEnd() {
    if (!activeFast) return;
    Alert.alert(
      'End fast now?',
      'This will stamp the finish time onto your saved history.',
      [
        { text: 'Keep fasting', style: 'cancel' },
        { text: 'End fast', style: 'destructive', onPress: () => endFast() },
      ],
    );
  }

  return (
    <ScreenBackground palette={palette}>
      <SafeAreaView style={[styles.flex, { backgroundColor: 'transparent' }]} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 132 }}>
          <FastCoachHeader title="Fasting Tracker" palette={palette} />

          {/* Timer */}
          <View style={styles.ringWrap}>
            <CircularRing
              size={RING}
              stroke={RING_STROKE}
              progress={ringProgress}
              svgGradientId="fastCoachRingFast"
              trackColor={palette.surfaceContainerHigh}
              gradientStart={palette.primaryFixedDim}
              gradientEnd={`${palette.primaryFixedDim}22`}>
              <View
                style={[
                  styles.innerDisc,
                  {
                    width: RING - RING_STROKE * 2 - 26,
                    height: RING - RING_STROKE * 2 - 26,
                    backgroundColor: palette.surfaceContainerLowest + 'CC',
                  },
                ]}>
                <Text style={[styles.ringLabel, { color: palette.outline }]}>
                  {activeFast ? 'Elapsed time' : 'Ready'}
                </Text>
                <Text
                  style={[
                    styles.ringClock,
                    { color: activeFast ? palette.primary : palette.onSurfaceVariant, fontFamily: FastCoachFonts.display },
                  ]}
                  accessibilityRole="text"
                  accessibilityLabel="Elapsed fasting time">
                  {activeFast ? formatElapsedShort(elapsedMs) : formatElapsedShort(0)}
                </Text>
                <Text style={[styles.ringSub, { color: palette.onSurfaceVariant }]}>
                  {activeFast
                    ? targetMs && activeFast.targetDurationMinutes != null
                      ? `of ${formatTargetHm(activeFast.targetDurationMinutes)} goal`
                      : 'Open-ended fast'
                    : 'Choose a goal, then begin'}
                </Text>
              </View>
            </CircularRing>

            {/* Secondary line for seekers who prefer seconds */}
            <Text style={[styles.ringAlt, { color: palette.outline }]}>
              {activeFast ? `Precision: ${formatElapsed(elapsedMs)}` : 'Hydrate generously before you begin.'}
            </Text>

            {!activeFast ? (
              <>
                <View style={{ marginTop: 18, alignSelf: 'stretch' }}>
                  <Text style={[styles.sectionEyebrow, { color: palette.primary }]}>Goal length</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipsRow}>
                      {TARGET_CHOICES.map((t) => {
                        const sel = targetChoice.label === t.label && targetChoice.minutes === t.minutes;
                        return (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ selected: sel }}
                            key={t.label}
                            style={[
                              styles.chip,
                              {
                                borderColor: palette.outlineVariant,
                                backgroundColor: sel ? `${palette.primaryFixed}44` : `${palette.surfaceContainerLowest}AA`,
                              },
                            ]}
                            onPress={() => setTargetChoice(t)}>
                            <Text style={{ color: palette.onSurface, fontFamily: FastCoachFonts.label }}>{t.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                  <Text style={[styles.micro, { color: palette.onSurfaceVariant, marginTop: 8 }]}>
                    {targetChoice.minutes != null
                      ? `Target about ${formatTargetLabel(targetChoice.minutes)} awake time in the fast.`
                      : 'No countdown cap—still logs history when you finish.'}
                  </Text>
                </View>

                <Pressable
                  onPress={() => confirmStart()}
                  accessibilityRole="button"
                  accessibilityLabel={
                    targetChoice.minutes != null ? `Begin fast aiming for ${targetChoice.label}` : 'Begin open ended fast'
                  }
                  style={({ pressed }) => [
                    styles.heroCta,
                    {
                      backgroundColor: palette.primary,
                      opacity: pressed ? 0.9 : 1,
                      shadowColor: palette.primaryFixedDim,
                    },
                  ]}>
                  <MaterialCommunityIcons name="play-circle-outline" color={palette.onPrimary} size={24} />
                  <Text style={[styles.heroCtaText, { color: palette.onPrimary }]}>Begin fast</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => confirmEnd()}
                accessibilityRole="button"
                accessibilityLabel="End fasting session"
                style={({ pressed }) => [
                  styles.heroCta,
                  {
                    backgroundColor: palette.primary,
                    opacity: pressed ? 0.94 : 1,
                    shadowColor: palette.primaryFixedDim,
                  },
                ]}>
                <MaterialCommunityIcons name="stop-circle" color={palette.onPrimary} size={24} />
                <Text style={[styles.heroCtaText, { color: palette.onPrimary }]}>End fast</Text>
              </Pressable>
            )}
          </View>

          {/* Current phase */}
          <GlassCard palette={palette} style={{ padding: 20, gap: 12, marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
              <View
                style={[styles.phaseIconWrap, { backgroundColor: palette.primaryContainer + 'DD' }]}>
                <MaterialCommunityIcons name={stage.icon} color={palette.onPrimaryContainer} size={26} />
              </View>
              <View style={{ flex: 1, gap: 10 }}>
                <View style={[styles.phasePill, { backgroundColor: `${palette.primary}18` }]}>
                  <Text
                    style={[
                      styles.phasePillText,
                      { color: palette.primary, fontFamily: FastCoachFonts.label },
                    ]}>
                    Current phase
                  </Text>
                </View>
                <Text
                  style={[
                    styles.phaseTitle,
                    { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd },
                  ]}>
                  {stage.title}
                </Text>
                <Text style={[styles.phaseBody, { color: palette.onSurfaceVariant }]}>
                  {stage.description}
                </Text>
              </View>
            </View>
          </GlassCard>

          <EatSuggestionsCard title={eatTitle} picks={eats} onShuffle={bumpSuggestionShuffle} palette={palette} />

          <Text style={[styles.disclaimer, { color: palette.onSurfaceVariant }]}>
            Educational companion only—not medical advice. If you feel unwell, end the fast and seek care.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  ringWrap: {
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
    marginBottom: 12,
  },
  innerDisc: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 4,
  },
  ringLabel: {
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FastCoachFonts.label,
  },
  ringClock: {
    fontVariant: ['tabular-nums'],
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 2,
    letterSpacing: -1,
    textAlign: 'center',
  },
  ringSub: {
    fontSize: 15,
    marginTop: 2,
    textAlign: 'center',
    fontFamily: FastCoachFonts.body,
  },
  ringAlt: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: FastCoachFonts.bodyLight,
    letterSpacing: 0.2,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 30,
    marginTop: 18,
    width: '100%',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  heroCtaText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    fontFamily: FastCoachFonts.headlineMd,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 4,
    marginTop: 8,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 6,
  },
  sectionEyebrow: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontWeight: '700',
    fontFamily: FastCoachFonts.label,
  },
  phaseIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phasePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  phasePillText: {
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '700',
  },
  phaseTitle: {
    fontSize: 22,
    letterSpacing: -0.25,
    lineHeight: 28,
    fontWeight: '700',
  },
  phaseBody: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FastCoachFonts.body,
  },
  micro: { fontSize: 12, lineHeight: 17, fontFamily: FastCoachFonts.body },
  disclaimer: {
    marginTop: 22,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: FastCoachFonts.body,
  },
});
