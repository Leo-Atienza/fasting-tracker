import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import rawSuggestions from '@/assets/data/eat-suggestions.json';
import { FastCoachFonts, FastCoachPalette, type ColorSchemeName } from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { FixedTopBar, useTopBarOffset } from '@/src/components/fastCoach/FixedTopBar';
import { GlassCard } from '@/src/components/fastCoach/GlassCard';
import { ScreenBackground } from '@/src/components/fastCoach/ScreenBackground';
import { SectionLabel } from '@/src/components/fastCoach/SectionLabel';
import type { EatSuggestion } from '@/src/domain/types';
import { aggregateMedicalSources } from '@/src/features/eat/aggregateSources';

const SUGGESTIONS = rawSuggestions as EatSuggestion[];

export default function CreditsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = (colorScheme === 'dark' ? 'dark' : 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];
  const topBarOffset = useTopBarOffset();

  const sources = useMemo(() => aggregateMedicalSources(SUGGESTIONS), []);

  function onOpenUrl(url: string) {
    Linking.openURL(url).catch(() => undefined);
  }

  return (
    <ScreenBackground palette={palette} accent="settings">
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <FixedTopBar
          title="Sources & credits"
          palette={palette}
          isDark={scheme === 'dark'}
          showHistory={false}
          rightAccessory={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close sources & credits"
              hitSlop={10}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
              <MaterialCommunityIcons name="close" size={22} color={palette.onSurfaceVariant} />
            </Pressable>
          }
        />

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topBarOffset + 20 }]}
          showsVerticalScrollIndicator={false}>
          <SectionLabel palette={palette}>EVIDENCE BEHIND THE MEAL FACTS</SectionLabel>
          <View style={styles.intro}>
            <Text style={[styles.introText, { color: palette.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
              The hand-curated meal presets carry short evidence notes. Each note is
              attributed to one of the {sources.length} institutional sources below.
              Tap a source to open the canonical reference in your browser.
            </Text>
          </View>

          {sources.map((entry) => {
            const hasUrl = !!entry.sourceUrl;
            return (
              <GlassCard key={entry.source} palette={palette} radius={20} style={styles.card}>
                <Text style={[styles.title, { color: palette.onSurface, fontFamily: FastCoachFonts.body }]}>
                  {entry.source}
                </Text>
                <Text style={[styles.usedIn, { color: palette.outline, fontFamily: FastCoachFonts.label }]}>
                  USED IN {entry.usedIn} MEAL PRESET{entry.usedIn === 1 ? '' : 'S'}
                </Text>
                {hasUrl ? (
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`Open source for ${entry.source}`}
                    accessibilityHint="Opens the canonical URL in your browser."
                    onPress={() => onOpenUrl(entry.sourceUrl!)}
                    style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.86 }]}>
                    <MaterialCommunityIcons name="open-in-new" size={16} color={palette.primary} />
                    <Text style={[styles.linkText, { color: palette.primary, fontFamily: FastCoachFonts.body }]}>
                      Open source
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.noLink, { color: palette.outline, fontFamily: FastCoachFonts.bodyLight }]}>
                    Referenced by institution name only — no canonical URL on file.
                  </Text>
                )}
              </GlassCard>
            );
          })}

          <Text style={[styles.footer, { color: palette.outline, fontFamily: FastCoachFonts.bodyLight }]}>
            Notes are educational only and not medical advice. Decisions about
            fasting or dietary changes should involve a qualified clinician,
            especially for anyone pregnant or breastfeeding, under 18, or
            managing a medical condition.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingBottom: 80, gap: 12 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: { paddingHorizontal: 6, paddingBottom: 4 },
  introText: { fontSize: 13, lineHeight: 18 },
  card: { padding: 16, gap: 8 },
  title: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  usedIn: { fontSize: 10, letterSpacing: 1.4, fontWeight: '800' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  linkText: { fontSize: 13, fontWeight: '700' },
  noLink: { fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  footer: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 24,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
});
