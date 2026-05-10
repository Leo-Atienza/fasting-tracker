import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FastCoachPalette } from '@/constants/FastCoachTheme';
import { FastCoachFonts } from '@/constants/FastCoachTheme';

type Props = {
  title: string;
  palette: FastCoachPalette;
  /** Omit history icon (e.g. secondary screens with stack back button). */
  showHistory?: boolean;
  /** When set, replaces the settings affordance (e.g. Facts shuffle). */
  rightAccessory?: React.ReactNode;
};

export function FastCoachHeader({ title, palette, showHistory = true, rightAccessory }: Props) {
  return (
    <View style={styles.row}>
      {showHistory ? (
        <Link href="/history" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open fast history"
            style={({ pressed }) => [styles.iconHit, { opacity: pressed ? 0.7 : 1 }]}
            hitSlop={8}>
            <MaterialCommunityIcons name="history" size={24} color={palette.onSurfaceVariant} />
          </Pressable>
        </Link>
      ) : (
        <View style={styles.iconHit} />
      )}
      <Text
        accessibilityRole="header"
        style={[
          styles.title,
          { color: palette.onSurface, fontFamily: FastCoachFonts.headlineLg },
        ]}>
        {title}
      </Text>
      {rightAccessory ? (
        <View style={styles.iconHit}>{rightAccessory}</View>
      ) : (
        <Link href="/settings" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            style={({ pressed }) => [styles.iconHit, { opacity: pressed ? 0.7 : 1 }]}
            hitSlop={8}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={palette.onSurfaceVariant} />
          </Pressable>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    minHeight: 48,
    marginBottom: 8,
  },
  iconHit: { width: 40, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
