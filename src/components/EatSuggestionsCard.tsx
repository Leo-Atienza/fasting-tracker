import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  AccessibilityProps,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import type { FastCoachPalette } from '@/constants/FastCoachTheme';
import { FastCoachFonts, FastCoachSpacing } from '@/constants/FastCoachTheme';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';

import type { EatSuggestion } from '@/src/domain/types';

type Props = {
  title: string;
  picks: EatSuggestion[];
  onShuffle: () => void;
  palette: FastCoachPalette;
};

const ACCENTS: [string, string][] = [
  ['#34c75922', '#0070eb18'],
  ['#0070eb1a', '#4f4ccd25'],
];

function previewLine(suggestion: EatSuggestion): string {
  const first = suggestion.bullets[0];
  return first ? first.replace(/\.$/, '').slice(0, 104) + (first.length > 104 ? '…' : '') : '';
}

export function EatSuggestionsCard({ title, picks, onShuffle, palette }: Props) {
  const { width } = useWindowDimensions();
  const gutter = FastCoachSpacing.gutter;
  const tileWidth = Math.max(140, (width - gutter * 2 - 16) / 2);

  const cardA11y: AccessibilityProps = {
    accessibilityRole: 'summary',
    accessibilityLabel: `${title} tips`,
  };

  return (
    <View {...cardA11y} style={{ marginTop: FastCoachSpacing.stackMd, gap: 14 }}>
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionHeading, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineMd }]}>
          {title}
        </Text>
        <Pressable onPress={() => router.push('/facts')} hitSlop={8} accessibilityRole="link">
          <Text style={[styles.viewAll, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>See facts tab</Text>
        </Pressable>
      </View>

      <View style={styles.titleRowShuffle}>
        <Text style={[styles.helper, { color: palette.outline }]}>
          Educational ideas—not medical prescriptions.
        </Text>
        <Pressable
          onPress={onShuffle}
          accessibilityRole="button"
          accessibilityLabel="Show another suggestion pair"
          style={({ pressed }) => [styles.shuffleBtn, pressed && { opacity: 0.75 }]}>
          <MaterialCommunityIcons name="shuffle-variant" color={palette.primary} size={20} />
          <Text style={{ color: palette.primary, fontFamily: FastCoachFonts.label }}>Shuffle</Text>
        </Pressable>
      </View>

      {picks.length === 0 ? (
        <GlassCard palette={palette} style={{ padding: 18 }}>
          <Text style={{ color: palette.onSurface }}>
            No tips match this combo yet—adjust diet preference in Settings.
          </Text>
        </GlassCard>
      ) : (
        <View style={styles.bento}>
          {picks.map((item, idx) => {
            const accent = ACCENTS[idx % ACCENTS.length]!;
            return (
              <GlassCard palette={palette} key={item.id} style={[styles.tile, { width: tileWidth }]}>
                <LinearGradient colors={accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tileHero}>
                  <MaterialCommunityIcons name="silverware-fork-knife" size={34} color={palette.primary} />
                </LinearGradient>
                <View style={styles.tileBody}>
                  <Text
                    style={[styles.tileTitle, { color: palette.onSurface, fontFamily: FastCoachFonts.label }]}
                    numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.tileSnippet, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.bodyLight }]}>
                    {previewLine(item)}
                  </Text>
                </View>
              </GlassCard>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionHeading: { fontSize: 22 },
  viewAll: { fontWeight: '700', letterSpacing: 0.08 * 13, textTransform: 'uppercase', fontSize: 12 },
  titleRowShuffle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: 2,
  },
  helper: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FastCoachFonts.bodyLight,
    letterSpacing: 0.2,
  },
  shuffleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, paddingVertical: 4 },
  bento: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  tile: {
    overflow: 'hidden',
    padding: 0,
  },
  tileHero: {
    height: 120,
    width: '100%',
    justifyContent: 'flex-end',
    padding: 14,
  },
  tileBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  tileTitle: { fontWeight: '700', fontSize: 15 },
  tileSnippet: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.85,
    marginTop: 2,
  },
});
