import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import factsDataset from '@/assets/data/fasting-facts.json';

import { FastCoachFonts, FastCoachPalette, type ColorSchemeName } from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { FastCoachHeader } from '@/src/components/fastCoach/FastCoachHeader';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
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

function groupCounts() {
  let focus = 0;
  let other = 0;
  for (const f of FACTS) {
    if (f.theme === 'cognition') focus += 1;
    else other += 1;
  }
  return { focus, other };
}

export default function FactsScreen() {
  const scheme = (useColorScheme() ?? 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];

  const [shuffle, setShuffle] = useState(0);
  const [expandFavorites, setExpandFavorites] = useState(false);

  const favoriteFactIds = useAppStore((s) => s.favoriteFactIds);
  const toggleFavoriteFact = useAppStore((s) => s.toggleFavoriteFact);

  const curated = useMemo(() => {
    const idx = hashString(`${dayKey()}-${shuffle}`) % FACTS.length;
    return FACTS[idx]!;
  }, [shuffle]);

  const { focus, other } = useMemo(() => groupCounts(), []);
  const favorites = useMemo(
    () => FACTS.filter((f) => favoriteFactIds.includes(f.id)),
    [favoriteFactIds],
  );

  const shownFavorites = expandFavorites ? favorites : favorites.slice(0, 3);

  function handleShuffle() {
    setShuffle((s) => s + 1);
  }

  const headerShuffle = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Shuffle fact of the day"
      onPress={handleShuffle}
      style={({ pressed }) => [
        styles.shuffleFab,
        {
          backgroundColor: `${palette.surfaceContainerHigh}CC`,
          borderColor: palette.glassBorder,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <MaterialCommunityIcons name="shuffle-variant" size={22} color={palette.onSurface} />
    </Pressable>
  );

  return (
    <ScreenBackground palette={palette}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.pad}>
          <FastCoachHeader title="Facts" palette={palette} rightAccessory={headerShuffle} />

          <Text style={[styles.fotdEyebrow, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
            Fact of the day
          </Text>

          <GlassCard palette={palette} style={[styles.heroFact, styles.heroGlow]}>
            <LinearGradient
              colors={[`${palette.primaryFixed}66`, `${palette.surfaceContainerLow}00`]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroRow}>
              <View style={[styles.boltWrap, { backgroundColor: palette.primaryContainer }]}>
                <MaterialCommunityIcons name="lightning-bolt" color={palette.onPrimaryContainer} size={26} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  favoriteFactIds.includes(curated.id) ? 'Remove from favorites' : 'Save fact to favorites'
                }
                onPress={() => toggleFavoriteFact(curated.id)}
                style={styles.bookmarkTap}
                hitSlop={8}>
                <MaterialCommunityIcons
                  name={favoriteFactIds.includes(curated.id) ? 'bookmark' : 'bookmark-outline'}
                  size={30}
                  color={palette.primary}
                />
              </Pressable>
            </View>
            <Text
              accessibilityRole="header"
              style={[
                styles.heroTitle,
                { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd },
              ]}>
              {curated.title}
            </Text>
            <Text style={[styles.heroBody, { color: palette.onSurfaceVariant }]}>
              {curated.body}
            </Text>
            <View style={styles.heroTags}>
              <View style={[styles.tag, { backgroundColor: `${palette.surfaceVariant}BB` }]}>
                <Text style={[styles.tagText, { color: palette.outline }]}>
                  {THEME_TAG[curated.theme]}
                </Text>
              </View>
              <View style={[styles.tag, { backgroundColor: `${palette.surfaceVariant}BB` }]}>
                <Text style={[styles.tagText, { color: palette.outline }]}>FAST COACH NOTES</Text>
              </View>
            </View>
          </GlassCard>

          <View style={styles.bentoRow}>
            <GlassCard palette={palette} style={[styles.bentoCard, styles.bentoGlow]}>
              <MaterialCommunityIcons name="water" color={palette.secondary} size={28} />
              <Text style={[styles.bentoMuted, { color: palette.outline }]}>Focus & flow</Text>
              <Text style={[styles.bentoStat, { color: palette.onSurface }]}>{focus} facts</Text>
            </GlassCard>
            <GlassCard palette={palette} style={[styles.bentoCard, styles.bentoGlow]}>
              <MaterialCommunityIcons name="heart-pulse" color={palette.tertiary} size={27} />
              <Text style={[styles.bentoMuted, { color: palette.outline }]}>Other facts</Text>
              <Text style={[styles.bentoStat, { color: palette.onSurface }]}>{other} facts</Text>
            </GlassCard>
          </View>

          <Text style={[styles.favHd, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
            Your favorites
          </Text>

          <View style={{ gap: 12 }}>
            {favorites.length === 0 ? (
              <Text style={{ color: palette.onSurfaceVariant }}>
                Tap the bookmark chip on facts you want to revisit.
              </Text>
            ) : (
              <>
                {shownFavorites.map((fact) => (
                  <GlassCard palette={palette} key={fact.id} style={[styles.miniFav]}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => toggleFavoriteFact(fact.id)}
                      style={styles.favTap}>
                      <MaterialCommunityIcons name="star" color={palette.primary} size={22} />
                    </Pressable>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={[styles.miniTitle, { color: palette.onSurface }]}>{fact.title}</Text>
                      <Text style={[styles.miniBody, { color: palette.onSurfaceVariant }]}>{fact.body}</Text>
                      <Text style={[styles.miniTag, { color: palette.outline }]}>
                        {THEME_TAG[fact.theme]}
                      </Text>
                    </View>
                  </GlassCard>
                ))}
                {favorites.length > 3 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      expandFavorites ? 'Show fewer saved facts' : 'Show every saved fact'
                    }
                    accessibilityState={{ expanded: expandFavorites }}
                    onPress={() => setExpandFavorites((x) => !x)}
                    style={[
                      styles.viewAllChip,
                      { backgroundColor: `${palette.surfaceContainerHigh}BB`, borderColor: palette.glassBorder },
                    ]}>
                    <Text style={[styles.viewAllChipText, { color: palette.onSurface }]}>
                      {expandFavorites ? 'Collapse list' : 'View all favorites'}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>

          <GlassCard palette={palette} style={styles.banner}>
            <MaterialCommunityIcons name="shield-check" color={palette.primary} size={22} style={{ marginBottom: 10 }} />
            <Text style={[styles.bannerText, { color: palette.onSurfaceVariant }]}>
              Fasting is not safe for everyone. Check in with clinicians for medications, chronic conditions,
              pregnancy, or if you&apos;ve navigated eating disorders.
            </Text>
          </GlassCard>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: 'transparent' },
  pad: { paddingHorizontal: 22, paddingBottom: 132, gap: 14 },
  shuffleFab: {
    borderRadius: 999,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  fotdEyebrow: {
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  heroFact: { padding: 24 },
  heroGlow: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    overflow: 'hidden',
    position: 'relative',
    minHeight: 180,
    gap: 12,
    marginTop: 2,
    marginBottom: 6,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boltWrap: { width: 48, height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  bookmarkTap: {
    padding: 6,
  },
  heroTitle: { fontSize: 21, letterSpacing: -0.35, marginTop: 4, marginBottom: 4, lineHeight: 28 },
  heroBody: { fontFamily: FastCoachFonts.bodyLight, fontSize: 17, lineHeight: 26, letterSpacing: 0.2 },
  heroTags: { flexDirection: 'row', gap: 8, marginTop: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    letterSpacing: 1.9,
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FastCoachFonts.label,
  },
  bentoRow: { flexDirection: 'row', gap: 14, marginTop: 6 },
  bentoGlow: {},
  bentoCard: {
    flex: 1,
    padding: 22,
    borderRadius: 18,
    gap: 12,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  bentoMuted: { fontSize: 14, letterSpacing: 0.06 * 13, fontWeight: '600', marginTop: 14 },
  bentoStat: { fontWeight: '800', fontSize: 24 },
  favHd: { fontSize: 22, letterSpacing: -0.35, marginTop: 22, marginBottom: 12 },
  miniFav: {
    flexDirection: 'row',
    padding: 22,
    gap: 14,
    alignItems: 'flex-start',
  },
  favTap: { paddingTop: 4 },
  miniTitle: { fontWeight: '800', letterSpacing: -0.2, fontSize: 16 },
  miniBody: { fontSize: 15, fontFamily: FastCoachFonts.bodyLight, lineHeight: 24 },
  miniTag: { fontSize: 11, letterSpacing: 2, marginTop: 4, fontWeight: '700' },
  viewAllChip: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  viewAllChipText: { fontWeight: '700', letterSpacing: 0.06 * 12 },
  banner: {
    padding: 22,
    marginTop: 18,
    borderRadius: 22,
    alignItems: 'flex-start',
  },
  bannerText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FastCoachFonts.body,
    fontWeight: '500',
  },
});
