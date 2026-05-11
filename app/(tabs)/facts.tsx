import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import factsDataset from '@/assets/data/fasting-facts.json';

import { FastCoachFonts, FastCoachPalette, type ColorSchemeName } from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { FixedTopBar, useTopBarOffset } from '@/src/components/fastCoach/FixedTopBar';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
import { SectionLabel } from '@/src/components/fastCoach/SectionLabel';
import type { Fact, FactTheme } from '@/src/domain/types';
import { hashString } from '@/src/lib/hash';
import { dayKey } from '@/src/lib/time';
import { useAppStore } from '@/src/store/useAppStore';

const FACTS = factsDataset as Fact[];

const THEME_TAG: Record<FactTheme, string> = {
  metabolic: 'METABOLISM',
  cognition: 'FOCUS',
  longevity: 'LONGEVITY',
  general: 'PRACTICAL',
};

/** Two-bucket categorization matching the design's Hydration / Health bento. */
type Bucket = 'hydration' | 'health';
const BUCKET_BY_THEME: Record<FactTheme, Bucket> = {
  cognition: 'hydration', // focus/sleep/hydration/headache facts
  general: 'hydration',
  metabolic: 'health',
  longevity: 'health',
};

function countByBucket(): Record<Bucket, number> {
  const counts: Record<Bucket, number> = { hydration: 0, health: 0 };
  for (const f of FACTS) counts[BUCKET_BY_THEME[f.theme]] += 1;
  return counts;
}

export default function FactsScreen() {
  const scheme = (useColorScheme() ?? 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];
  const topBarOffset = useTopBarOffset();

  const [shuffle, setShuffle] = useState(0);
  const [filterBucket, setFilterBucket] = useState<Bucket | null>(null);
  const [expandFavorites, setExpandFavorites] = useState(false);

  const favoriteFactIds = useAppStore((s) => s.favoriteFactIds);
  const toggleFavoriteFact = useAppStore((s) => s.toggleFavoriteFact);

  const curated = useMemo(() => {
    const idx = hashString(`${dayKey()}-${shuffle}`) % FACTS.length;
    return FACTS[idx]!;
  }, [shuffle]);

  const counts = useMemo(() => countByBucket(), []);
  const favoritesAll = useMemo(() => FACTS.filter((f) => favoriteFactIds.includes(f.id)), [favoriteFactIds]);
  const favorites = filterBucket
    ? favoritesAll.filter((f) => BUCKET_BY_THEME[f.theme] === filterBucket)
    : favoritesAll;
  const shownFavorites = expandFavorites ? favorites : favorites.slice(0, 3);

  const headerShuffle = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Shuffle fact of the day"
      onPress={() => setShuffle((s) => s + 1)}
      style={({ pressed }) => [
        styles.shuffleFab,
        {
          backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)',
          borderColor: palette.glassBorder,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <MaterialCommunityIcons name="shuffle-variant" size={22} color={palette.onSurface} />
    </Pressable>
  );

  const isCuratedFav = favoriteFactIds.includes(curated.id);

  return (
    <ScreenBackground palette={palette} accent="facts">
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <FixedTopBar title="Facts" palette={palette} isDark={scheme === 'dark'} rightAccessory={headerShuffle} showHistory={false} />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topBarOffset + 18 }]} showsVerticalScrollIndicator={false}>
          <SectionLabel palette={palette} tone="primary">FACT OF THE DAY</SectionLabel>

          {/* Hero glass fact */}
          <GlassCard palette={palette} radius={28} tone="high" style={styles.hero}>
            <View style={[styles.heroBlob, { backgroundColor: `${palette.primaryFixed}55` }]} pointerEvents="none" />
            <View style={styles.heroRow}>
              <View style={[styles.boltOrb, { backgroundColor: palette.primaryContainer }]}>
                <MaterialCommunityIcons name="lightning-bolt" color={palette.onPrimaryContainer} size={22} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isCuratedFav ? 'Remove from favorites' : 'Save fact to favorites'}
                onPress={() => toggleFavoriteFact(curated.id)}
                hitSlop={10}>
                <MaterialCommunityIcons
                  name={isCuratedFav ? 'bookmark' : 'bookmark-outline'}
                  size={28}
                  color={palette.primary}
                />
              </Pressable>
            </View>
            <Text accessibilityRole="header" style={[styles.heroTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
              {curated.title}.
            </Text>
            <Text style={[styles.heroBody, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
              {curated.body}
            </Text>
            <View style={styles.tagRow}>
              <View style={[styles.tag, { backgroundColor: `${palette.surfaceVariant}AA` }]}>
                <Text style={[styles.tagText, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
                  {THEME_TAG[curated.theme]}
                </Text>
              </View>
              <View style={[styles.tag, { backgroundColor: `${palette.surfaceVariant}AA` }]}>
                <Text style={[styles.tagText, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
                  COACH NOTES
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Hydration / Health bento */}
          <View style={styles.bentoRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: filterBucket === 'hydration' }}
              onPress={() => setFilterBucket((b) => (b === 'hydration' ? null : 'hydration'))}
              style={({ pressed }) => [styles.bentoBtn, pressed && { opacity: 0.94 }]}>
              <GlassCard palette={palette} radius={22} style={[styles.bentoCard, filterBucket === 'hydration' && { borderColor: palette.secondary, borderWidth: 1.5 }]}>
                <MaterialCommunityIcons name="water" color={palette.secondary} size={26} />
                <Text style={[styles.bentoLabel, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                  Hydration
                </Text>
                <Text style={[styles.bentoStat, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
                  {counts.hydration} Facts
                </Text>
              </GlassCard>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: filterBucket === 'health' }}
              onPress={() => setFilterBucket((b) => (b === 'health' ? null : 'health'))}
              style={({ pressed }) => [styles.bentoBtn, pressed && { opacity: 0.94 }]}>
              <GlassCard palette={palette} radius={22} style={[styles.bentoCard, filterBucket === 'health' && { borderColor: palette.tertiary, borderWidth: 1.5 }]}>
                <MaterialCommunityIcons name="heart-pulse" color={palette.tertiary} size={26} />
                <Text style={[styles.bentoLabel, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
                  Health
                </Text>
                <Text style={[styles.bentoStat, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
                  {counts.health} Facts
                </Text>
              </GlassCard>
            </Pressable>
          </View>

          {/* Your Favorites */}
          <Text style={[styles.favHd, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
            Your Favorites
          </Text>

          {favoritesAll.length === 0 ? (
            <GlassCard palette={palette} radius={22} style={{ padding: 22, marginTop: 4 }}>
              <Text style={{ color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body, lineHeight: 22 }}>
                Tap the bookmark on the Fact of the Day or any fact you want to revisit — they show up here.
              </Text>
            </GlassCard>
          ) : (
            <View style={{ gap: 12 }}>
              {shownFavorites.map((fact) => (
                <GlassCard palette={palette} radius={22} key={fact.id} tone="low" style={styles.favCard}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove "${fact.title}" from favorites`}
                    onPress={() => toggleFavoriteFact(fact.id)}
                    hitSlop={8}
                    style={styles.favStar}>
                    <MaterialCommunityIcons name="star" color={palette.primary} size={22} />
                  </Pressable>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={[styles.favTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                      {fact.title}.
                    </Text>
                    <Text style={[styles.favBody, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
                      {fact.body}
                    </Text>
                    <Text style={[styles.favTag, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
                      {THEME_TAG[fact.theme]}
                    </Text>
                  </View>
                </GlassCard>
              ))}
              {favorites.length > 3 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={expandFavorites ? 'Show fewer saved facts' : 'Show every saved fact'}
                  accessibilityState={{ expanded: expandFavorites }}
                  onPress={() => setExpandFavorites((x) => !x)}
                  style={[
                    styles.viewAllChip,
                    {
                      backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.10)' : `${palette.surfaceContainerHigh}AA`,
                      borderColor: palette.glassBorder,
                    },
                  ]}>
                  <Text style={[styles.viewAllText, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                    {expandFavorites ? 'Collapse list' : 'View All Favorites'}
                  </Text>
                </Pressable>
              ) : null}
              {filterBucket && favorites.length === 0 ? (
                <Text style={{ color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight, textAlign: 'center' }}>
                  No favorites in this category yet.
                </Text>
              ) : null}
            </View>
          )}

          <GlassCard palette={palette} radius={20} tone="low" style={styles.banner}>
            <MaterialCommunityIcons name="shield-check" color={palette.primary} size={20} />
            <Text style={[styles.bannerText, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
              Fasting is not safe for everyone. Check in with clinicians for medications, chronic conditions, pregnancy, or if you've navigated eating disorders.
            </Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingBottom: 140, gap: 14 },
  shuffleFab: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  hero: { padding: 24, overflow: 'hidden', position: 'relative' },
  heroBlob: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 999 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  boltOrb: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 20, lineHeight: 28, letterSpacing: -0.3, marginBottom: 6, fontWeight: '700' },
  heroBody: { fontSize: 16, lineHeight: 24 },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  tagText: { fontSize: 10, letterSpacing: 1.6, fontWeight: '800' },
  bentoRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  bentoBtn: { flex: 1 },
  bentoCard: { padding: 18, gap: 6, minHeight: 110 },
  bentoLabel: { fontSize: 13, marginTop: 8 },
  bentoStat: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  favHd: { fontSize: 22, letterSpacing: -0.3, fontWeight: '700', marginTop: 14 },
  favCard: { flexDirection: 'row', padding: 18, gap: 12, alignItems: 'flex-start' },
  favStar: { paddingTop: 2 },
  favTitle: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  favBody: { fontSize: 13, lineHeight: 20 },
  favTag: { fontSize: 10, letterSpacing: 1.4, fontWeight: '800', marginTop: 2 },
  viewAllChip: {
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
  },
  viewAllText: { fontSize: 14, fontWeight: '700' },
  banner: {
    flexDirection: 'row',
    gap: 12,
    padding: 18,
    alignItems: 'flex-start',
    marginTop: 12,
  },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
