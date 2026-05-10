import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FastCoachFonts, type FastCoachPalette } from '@/constants/FastCoachTheme';

type Props = {
  title: string;
  palette: FastCoachPalette;
  onBack: () => void;
};

/** Consistent in-screen top bar for stack-only screens. */
export function StackTopBar({ title, palette, onBack }: Props) {
  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.75 : 1 }]}>
        <MaterialCommunityIcons name="chevron-left" size={28} color={palette.onSurface} />
      </Pressable>
      <Text style={[styles.title, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineLg }]}>
        {title}
      </Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, letterSpacing: -0.3 },
});

