import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FastCoachFonts, FastCoachPalette, type ColorSchemeName, type FastCoachPalette as PaletteColors } from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { CircularRing } from '@/src/components/fastCoach/CircularRing';
import { FixedTopBar, useTopBarOffset } from '@/src/components/fastCoach/FixedTopBar';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
import type { EatPhase, EatSuggestion, FoodCategory } from '@/src/domain/types';
import { pickEatSuggestions } from '@/src/features/eat/selectSuggestions';
import { computeElapsedMs, computeRingProgress } from '@/src/features/fast/elapsed';
import { getFastingStage } from '@/src/features/fast/fastingStage';
import { formatElapsed, formatElapsedShort, formatTargetHm } from '@/src/lib/time';
import { useAppStore } from '@/src/store/useAppStore';

const TARGET_CHOICES: { label: string; minutes: number | null }[] = [
  { label: 'Open', minutes: null },
  { label: '12 h', minutes: 12 * 60 },
  { label: '14 h', minutes: 14 * 60 },
  { label: '16 h', minutes: 16 * 60 },
  { label: '18 h', minutes: 18 * 60 },
  { label: '24 h', minutes: 24 * 60 },
];

const RING = 264;
const RING_STROKE = 12;

type MealIcon = 'leaf' | 'fish' | 'bowl-mix' | 'food-apple' | 'cup-water' | 'tea' | 'rice' | 'food-drumstick' | 'food-variant';

const MEAL_ACCENTS: { from: string; to: string }[] = [
  { from: 'rgba(114,254,136,0.40)', to: 'rgba(0,110,40,0.18)' },
  { from: 'rgba(173,198,255,0.45)', to: 'rgba(0,88,188,0.18)' },
  { from: 'rgba(226,223,255,0.55)', to: 'rgba(79,76,205,0.18)' },
  { from: 'rgba(255,224,178,0.55)', to: 'rgba(186,90,16,0.18)' },
];

/** Pick an icon that matches the suggestion title's content, falling back to the index rotation. */
function iconForSuggestion(title: string, idx: number): MealIcon {
  const t = title.toLowerCase();
  if (t.includes('hydrat') || t.includes('water')) return 'cup-water';
  if (t.includes('tea') || t.includes('coffee') || t.includes('electrolyte')) return 'tea';
  if (t.includes('vegan') || t.includes('plant') || t.includes('vegetable')) return 'leaf';
  if (t.includes('fish') || t.includes('seafood') || t.includes('pescatar')) return 'fish';
  if (t.includes('meat') || t.includes('protein')) return 'food-drumstick';
  if (t.includes('rice') || t.includes('grain') || t.includes('soup') || t.includes('broth') || t.includes('bowl')) return 'bowl-mix';
  if (t.includes('fruit') || t.includes('apple')) return 'food-apple';
  const cycle: MealIcon[] = ['leaf', 'fish', 'bowl-mix', 'food-apple', 'food-variant'];
  return cycle[idx % cycle.length]!;
}

const FOOD_LABELS: Record<FoodCategory, string> = {
  protein: 'Protein',
  vegetable: 'Veg',
  fruit: 'Fruit',
  grain: 'Grain',
  fat: 'Fat',
  dairy: 'Dairy',
  drink: 'Drink',
  fermented: 'Fermented',
  other: 'Other',
};

function formatTargetLabel(minutes: number): string {
  if (minutes % 60 === 0 && minutes >= 120) return `${minutes / 60} hours`;
  if (minutes % 60 === 0 && minutes === 60) return '1 hour';
  return `${minutes} minutes`;
}

function previewLine(text: string): string {
  return text.replace(/\.$/, '').slice(0, 86) + (text.length > 86 ? '…' : '');
}

export default function FastHomeScreen() {
  const scheme = (useColorScheme() ?? 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];
  const topBarOffset = useTopBarOffset();

  const activeFast = useAppStore((s) => s.activeFast);
  const startFast = useAppStore((s) => s.startFast);
  const endFast = useAppStore((s) => s.endFast);
  const dietPreferenceId = useAppStore((s) => s.dietPreferenceId);
  const shuffleNonce = useAppStore((s) => s.eatShuffleNonce);
  const bumpSuggestionShuffle = useAppStore((s) => s.bumpSuggestionShuffle);
  const defaultFastTargetMinutes = useAppStore((s) => s.defaultFastTargetMinutes);

  const initialTargetChoice = useMemo(() => {
    const match = TARGET_CHOICES.find((c) => c.minutes === defaultFastTargetMinutes);
    return match ?? TARGET_CHOICES[3] ?? { label: 'Open', minutes: null };
  }, [defaultFastTargetMinutes]);

  const [now, setNow] = useState(() => Date.now());
  const [targetChoice, setTargetChoice] =
    useState<(typeof TARGET_CHOICES)[number]>(initialTargetChoice);
  const [openMeal, setOpenMeal] = useState<EatSuggestion | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = useMemo(
    () => (activeFast ? computeElapsedMs(now, activeFast.startedAt) : 0),
    [activeFast, now],
  );

  const eats = useMemo(() => {
    const phases: EatPhase[] = activeFast != null ? ['during_fast'] : ['break_fast', 'eating_window'];
    return pickEatSuggestions(phases, dietPreferenceId, shuffleNonce, 2);
  }, [activeFast, dietPreferenceId, shuffleNonce]);

  const ringProgress = computeRingProgress(elapsedMs, activeFast?.targetDurationMinutes ?? null);
  const stage = getFastingStage(elapsedMs, Boolean(activeFast));

  function confirmStart() {
    if (activeFast) return;
    startFast({ targetDurationMinutes: targetChoice.minutes ?? null });
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
    <ScreenBackground palette={palette} accent="fast">
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <FixedTopBar title="Fasting Tracker" palette={palette} isDark={scheme === 'dark'} />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topBarOffset + 36 }]} showsVerticalScrollIndicator={false}>
          {/* Hero ring */}
          <View style={styles.ringWrap}>
            <View style={[styles.ringHalo, { shadowColor: palette.primaryFixedDim }]}>
              <CircularRing
                size={RING}
                stroke={RING_STROKE}
                progress={activeFast ? Math.max(0.04, ringProgress) : 0.03}
                svgGradientId="fastCoachRing"
                trackColor={`${palette.primaryFixed}33`}
                gradientStart={palette.primaryFixedDim}
                gradientEnd={palette.primary}>
                <View
                  style={[
                    styles.ringInner,
                    {
                      backgroundColor: scheme === 'dark' ? 'rgba(26,28,31,0.86)' : 'rgba(255,255,255,0.92)',
                      width: RING - RING_STROKE * 2 - 24,
                      height: RING - RING_STROKE * 2 - 24,
                    },
                  ]}>
                  <Text style={[styles.ringEyebrow, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
                    {activeFast ? 'ELAPSED TIME' : 'READY TO START'}
                  </Text>
                  <Text
                    accessibilityRole="text"
                    accessibilityLabel="Fasting elapsed time"
                    style={[styles.ringClock, { color: activeFast ? palette.primary : palette.onSurface, fontFamily: FastCoachFonts.display }]}>
                    {activeFast ? formatElapsedShort(elapsedMs) : '00:00'}
                  </Text>
                  <Text style={[styles.ringSub, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                    {activeFast
                      ? activeFast.targetDurationMinutes != null
                        ? `of ${formatTargetHm(activeFast.targetDurationMinutes)} Goal`
                        : 'Open-ended fast'
                      : 'Tap a goal to begin'}
                  </Text>
                </View>
              </CircularRing>
            </View>

            {activeFast ? (
              <Text style={[styles.precision, { color: palette.outline, fontFamily: FastCoachFonts.bodyLight }]}>
                Precision · {formatElapsed(elapsedMs)}
              </Text>
            ) : null}
          </View>

          {/* Goal length chips OR End-fast CTA */}
          {!activeFast ? (
            <View style={styles.chipColumn}>
              <Text style={[styles.eyebrow, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
                CHOOSE GOAL LENGTH
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {TARGET_CHOICES.map((t) => {
                  const sel = targetChoice.label === t.label && targetChoice.minutes === t.minutes;
                  return (
                    <Pressable
                      key={t.label}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sel }}
                      onPress={() => setTargetChoice(t)}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          borderColor: sel ? palette.primary : palette.outlineVariant,
                          backgroundColor: sel
                            ? `${palette.primaryFixed}55`
                            : scheme === 'dark'
                            ? 'rgba(26,28,31,0.55)'
                            : 'rgba(255,255,255,0.65)',
                        },
                        pressed && { opacity: 0.85 },
                      ]}>
                      <Text style={{ color: sel ? palette.primary : palette.onSurface, fontFamily: FastCoachFonts.label, fontWeight: '700' }}>
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Text style={[styles.micro, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
                {targetChoice.minutes != null
                  ? `Target about ${formatTargetLabel(targetChoice.minutes)} awake time in the fast.`
                  : 'No countdown cap — still logs history when you finish.'}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={activeFast ? confirmEnd : confirmStart}
            accessibilityRole="button"
            accessibilityLabel={activeFast ? 'End fasting session' : 'Begin fasting session'}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: palette.primary,
                shadowColor: palette.primaryFixedDim,
                opacity: pressed ? 0.92 : 1,
              },
            ]}>
            <MaterialCommunityIcons name={activeFast ? 'stop' : 'play'} color={palette.onPrimary} size={22} />
            <Text style={[styles.ctaText, { color: palette.onPrimary, fontFamily: FastCoachFonts.headlineMd }]}>
              {activeFast ? 'End Fast' : 'Begin Fast'}
            </Text>
          </Pressable>

          {/* Current Phase glass card */}
          <GlassCard palette={palette} radius={28} style={styles.phaseCard}>
            <View style={styles.phaseRow}>
              <View style={[styles.phaseIcon, { backgroundColor: palette.primaryContainer }]}>
                <MaterialCommunityIcons name={stage.icon} size={24} color={palette.onPrimaryContainer} />
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <View style={[styles.phasePill, { backgroundColor: `${palette.primary}1A` }]}>
                  <Text style={[styles.phasePillText, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
                    CURRENT PHASE
                  </Text>
                </View>
                <Text style={[styles.phaseTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
                  {stage.title}
                </Text>
                <Text style={[styles.phaseBody, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                  {stage.description}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Next Meal Ideas bento */}
          <View style={styles.mealHeading}>
            <Text style={[styles.sectionH, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
              {activeFast ? 'Next Meal Ideas' : 'Ideas Between Fasts'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Shuffle meal ideas"
              onPress={bumpSuggestionShuffle}
              hitSlop={8}>
              <Text style={[styles.viewAll, { color: palette.primary, fontFamily: FastCoachFonts.body }]}>Shuffle</Text>
            </Pressable>
          </View>

          <View style={styles.bentoGrid}>
            {eats.length === 0 ? (
              <GlassCard palette={palette} style={{ flex: 1, padding: 20, minHeight: 140 }}>
                <Text style={{ color: palette.onSurface, fontFamily: FastCoachFonts.body }}>
                  No tips match this combo yet — adjust diet preference in Settings.
                </Text>
              </GlassCard>
            ) : (
              eats.map((item, idx) => {
                const accent = MEAL_ACCENTS[idx % MEAL_ACCENTS.length]!;
                const icon = iconForSuggestion(item.title, idx);
                const hasDetails =
                  (item.ingredients && item.ingredients.length > 0) ||
                  item.medicalNote != null ||
                  (item.foodTypes && item.foodTypes.length > 0);
                const accessibilityLabel = hasDetails
                  ? `${item.title} — tap for ingredients and details`
                  : item.title;
                return (
                  <Pressable
                    key={item.id}
                    onPress={hasDetails ? () => setOpenMeal(item) : undefined}
                    accessibilityRole="button"
                    accessibilityLabel={accessibilityLabel}
                    style={({ pressed }) => [styles.mealCard, pressed && hasDetails && { opacity: 0.92 }]}>
                    <GlassCard palette={palette} radius={22} style={styles.mealCardInner}>
                      <View
                        style={[
                          styles.mealArt,
                          { backgroundColor: accent.from, borderBottomColor: palette.glassBorder },
                        ]}>
                        <View style={[styles.mealArtOverlay, { backgroundColor: accent.to }]} />
                        <View style={[styles.mealIconHalo, { backgroundColor: palette.surfaceContainerLowest }]}>
                          <MaterialCommunityIcons name={icon} size={32} color={palette.primary} />
                        </View>
                        {item.prepMinutes != null && item.prepMinutes > 0 ? (
                          <View style={[styles.mealPrepBadge, { backgroundColor: `${palette.surfaceContainerHigh}EE` }]}>
                            <MaterialCommunityIcons name="clock-outline" size={12} color={palette.onSurfaceVariant} />
                            <Text style={[styles.mealPrepBadgeText, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.label }]}>
                              {item.prepMinutes}m
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.mealBody}>
                        <Text style={[styles.mealTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.foodTypes && item.foodTypes.length > 0 ? (
                          <View style={styles.mealTagRow}>
                            {item.foodTypes.slice(0, 3).map((cat) => (
                              <View
                                key={`${item.id}-${cat}`}
                                style={[styles.mealTag, { backgroundColor: `${palette.primary}14`, borderColor: `${palette.primary}22` }]}>
                                <Text style={[styles.mealTagText, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
                                  {FOOD_LABELS[cat]}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={[styles.mealKcal, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
                            GUIDANCE
                          </Text>
                        )}
                        <Text
                          style={[styles.mealSnippet, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}
                          numberOfLines={2}>
                          {previewLine(item.bullets[0] ?? '')}
                        </Text>
                      </View>
                    </GlassCard>
                  </Pressable>
                );
              })
            )}
          </View>

          <Text style={[styles.disclaimer, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
            Educational companion only — not medical advice. If you feel unwell, end the fast and seek care.
          </Text>
        </ScrollView>

        <MealDetailSheet
          meal={openMeal}
          palette={palette}
          scheme={scheme}
          onClose={() => setOpenMeal(null)}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

function MealDetailSheet({
  meal,
  palette,
  scheme,
  onClose,
}: {
  meal: EatSuggestion | null;
  palette: PaletteColors;
  scheme: ColorSchemeName;
  onClose: () => void;
}) {
  return (
    <Modal visible={meal != null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityLabel="Close meal details">
        <Pressable style={[styles.sheetCard, { backgroundColor: scheme === 'dark' ? '#1B1D20' : '#FFFFFF' }]} onPress={(e) => e.stopPropagation()}>
          <ScrollView contentContainerStyle={styles.sheetScroll}>
            <View style={styles.sheetHandle}>
              <View style={[styles.sheetGrabber, { backgroundColor: palette.outlineVariant }]} />
            </View>

            {meal ? (
              <>
                <Text style={[styles.sheetTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.display }]}>
                  {meal.title}
                </Text>

                {meal.foodTypes && meal.foodTypes.length > 0 ? (
                  <View style={styles.sheetTagRow}>
                    {meal.foodTypes.map((cat) => (
                      <View
                        key={`sheet-${cat}`}
                        style={[
                          styles.sheetTag,
                          { backgroundColor: `${palette.primary}1A`, borderColor: `${palette.primary}33` },
                        ]}>
                        <Text style={[styles.sheetTagText, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
                          {FOOD_LABELS[cat].toUpperCase()}
                        </Text>
                      </View>
                    ))}
                    {meal.prepMinutes != null && meal.prepMinutes > 0 ? (
                      <View
                        style={[
                          styles.sheetTag,
                          { backgroundColor: `${palette.outline}1A`, borderColor: `${palette.outline}33` },
                        ]}>
                        <MaterialCommunityIcons name="clock-outline" size={11} color={palette.outline} />
                        <Text style={[styles.sheetTagText, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
                          {meal.prepMinutes} MIN
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {meal.ingredients && meal.ingredients.length > 0 ? (
                  <View style={styles.sheetSection}>
                    <Text style={[styles.sheetEyebrow, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
                      INGREDIENTS
                    </Text>
                    <View style={{ gap: 8 }}>
                      {meal.ingredients.map((ing, idx) => (
                        <View key={`${meal.id}-i-${idx}`} style={styles.ingredientRow}>
                          <MaterialCommunityIcons name="circle-medium" size={18} color={palette.primary} />
                          <Text style={[styles.ingredientName, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                            {ing.name}
                          </Text>
                          {ing.amount ? (
                            <Text
                              style={[
                                styles.ingredientAmount,
                                { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight },
                              ]}>
                              {ing.amount}
                            </Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {meal.bullets.length > 0 ? (
                  <View style={styles.sheetSection}>
                    <Text style={[styles.sheetEyebrow, { color: palette.secondary, fontFamily: FastCoachFonts.label }]}>
                      NOTES
                    </Text>
                    {meal.bullets.map((b, i) => (
                      <Text
                        key={`${meal.id}-b-${i}`}
                        style={[styles.sheetBullet, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                        • {b}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {meal.medicalNote ? (
                  <View
                    style={[
                      styles.medicalCard,
                      { backgroundColor: `${palette.secondaryContainer}55`, borderLeftColor: palette.secondary },
                    ]}>
                    <MaterialCommunityIcons name="information-outline" size={20} color={palette.secondary} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={[styles.medicalEyebrow, { color: palette.secondary, fontFamily: FastCoachFonts.label }]}>
                        EVIDENCE NOTE
                      </Text>
                      <Text style={[styles.medicalBody, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                        {meal.medicalNote.text}
                      </Text>
                      <Text style={[styles.medicalSource, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
                        Source: {meal.medicalNote.source}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  style={({ pressed }) => [
                    styles.sheetCloseBtn,
                    { backgroundColor: palette.primary, opacity: pressed ? 0.86 : 1 },
                  ]}>
                  <Text style={[styles.sheetCloseText, { color: palette.onPrimary, fontFamily: FastCoachFonts.headlineMd }]}>
                    Close
                  </Text>
                </Pressable>
              </>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingBottom: 140, gap: 22 },
  ringWrap: { alignItems: 'center', gap: 12, marginTop: 12 },
  ringHalo: {
    borderRadius: 9999,
    shadowOpacity: 0.18,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  ringInner: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  ringEyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 2,
  },
  ringClock: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '800',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  ringSub: {
    fontSize: 15,
    marginTop: 4,
    textAlign: 'center',
  },
  precision: {
    fontSize: 12,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  chipColumn: { gap: 10 },
  eyebrow: { fontSize: 11, letterSpacing: 1.8, fontWeight: '800' },
  chipRow: { gap: 8, paddingVertical: 4, paddingRight: 12 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  micro: { fontSize: 12, lineHeight: 17 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 30,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  ctaText: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  phaseCard: { padding: 20 },
  phaseRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  phaseIcon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phasePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  phasePillText: { fontSize: 10, letterSpacing: 1.6, fontWeight: '800' },
  phaseTitle: { fontSize: 22, letterSpacing: -0.3, lineHeight: 28, fontWeight: '700' },
  phaseBody: { fontSize: 15, lineHeight: 22 },
  mealHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  sectionH: { fontSize: 22, letterSpacing: -0.3, fontWeight: '700' },
  viewAll: { fontSize: 14, fontWeight: '600' },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 22,
    overflow: 'hidden',
  },
  mealCardInner: {
    overflow: 'hidden',
    padding: 0,
  },
  mealPrepBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  mealPrepBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  mealTagRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 2 },
  mealTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mealTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  mealArt: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  mealArtOverlay: { ...StyleSheet.absoluteFillObject },
  mealIconHalo: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  mealBody: { padding: 14, gap: 4 },
  mealTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.1 },
  mealKcal: { fontSize: 10, letterSpacing: 1.4, fontWeight: '800' },
  mealSnippet: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  disclaimer: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  sheetScroll: { paddingTop: 8, paddingBottom: 12, gap: 16 },
  sheetHandle: { alignItems: 'center', paddingVertical: 6 },
  sheetGrabber: { width: 44, height: 5, borderRadius: 999 },
  sheetTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4, lineHeight: 30 },
  sheetTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  sheetTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetTagText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.0 },
  sheetSection: { gap: 8, marginTop: 4 },
  sheetEyebrow: { fontSize: 11, letterSpacing: 1.6, fontWeight: '800' },
  sheetBullet: { fontSize: 14, lineHeight: 20 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ingredientName: { flex: 1, fontSize: 14, lineHeight: 20 },
  ingredientAmount: { fontSize: 13, fontVariant: ['tabular-nums'] },
  medicalCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    marginTop: 6,
  },
  medicalEyebrow: { fontSize: 10, letterSpacing: 1.6, fontWeight: '800' },
  medicalBody: { fontSize: 14, lineHeight: 20 },
  medicalSource: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  sheetCloseBtn: {
    marginTop: 14,
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: { fontSize: 16, fontWeight: '800', letterSpacing: -0.1 },
});
