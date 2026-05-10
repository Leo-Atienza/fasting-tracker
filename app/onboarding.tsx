import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { DIET_OPTIONS } from '@/src/constants/diets';
import type { DietPreferenceId } from '@/src/domain/types';
import { useAppStore } from '@/src/store/useAppStore';

export default function OnboardingScreen() {
  const theme = useColorScheme() ?? 'light';
  const palette = Colors[theme];
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const skipOnboarding = useAppStore((s) => s.skipOnboarding);

  function choose(pref: DietPreferenceId) {
    completeOnboarding(pref);
    router.replace('/');
  }

  function skip() {
    skipOnboarding();
    router.replace('/');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: palette.text }]} accessibilityRole="header">
          How do you usually eat?
        </Text>
        <Text style={[styles.sub, { color: palette.tabIconDefault }]}>
          We use this only to personalize meal ideas after fasting. Nothing here is medical
          advice.
        </Text>
        <View style={styles.list}>
          {DIET_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              accessibilityRole="button"
              accessibilityLabel={`${opt.label}: ${opt.description}`}
              onPress={() => choose(opt.id)}
              style={({ pressed }) => [
                styles.card,
                {
                  borderColor: palette.tabIconDefault,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <FontAwesome name="cutlery" size={20} color={palette.tint} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optTitle, { color: palette.text }]}>{opt.label}</Text>
                  <Text style={[styles.optSub, { color: palette.tabIconDefault }]}>
                    {opt.description}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={skip}
          accessibilityRole="button"
          accessibilityLabel="Skip diet preferences for now">
          <Text style={[styles.skip, { color: palette.tint }]}>Skip for now</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  title: { fontSize: 26, fontWeight: '800' },
  sub: {
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    gap: 10,
    marginTop: 6,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    backgroundColor: 'transparent',
  },
  optTitle: { fontSize: 17, fontWeight: '700' },
  optSub: { marginTop: 4, fontSize: 13, lineHeight: 18 },
  skip: { marginTop: 12, alignSelf: 'center', fontWeight: '600', fontSize: 16 },
});
