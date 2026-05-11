import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FastCoachPalette } from '@/constants/FastCoachTheme';
import { FastCoachFonts } from '@/constants/FastCoachTheme';

type Props = {
  title: string;
  palette: FastCoachPalette;
  isDark?: boolean;
  /** Show history icon on the left. */
  showHistory?: boolean;
  /** Replace settings icon with a custom node (e.g. shuffle). */
  rightAccessory?: React.ReactNode;
  /** Hide the right slot entirely. */
  hideRight?: boolean;
};

/**
 * Fixed glass top app bar — sits absolutely at the top with translucent blur,
 * matching the Stitch design language across every primary screen.
 */
export function FixedTopBar({
  title,
  palette,
  isDark = false,
  showHistory = true,
  rightAccessory,
  hideRight = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 12);

  return (
    <View style={[styles.wrap, { paddingTop: topPad }]} pointerEvents="box-none">
      <BlurView
        intensity={Platform.select({ ios: 40, android: 24, web: 0 })}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark ? 'rgba(26,28,31,0.78)' : 'rgba(249,249,254,0.80)',
            borderBottomColor: palette.glassBorder,
            borderBottomWidth: StyleSheet.hairlineWidth,
          },
        ]}
      />
      <View style={styles.row}>
        {showHistory ? (
          <Link href="/history" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open fast history"
              hitSlop={10}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
              <MaterialCommunityIcons name="history" size={24} color={palette.onSurfaceVariant} />
            </Pressable>
          </Link>
        ) : (
          <View style={styles.iconBtn} />
        )}

        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={[styles.title, { color: palette.onSurface, fontFamily: FastCoachFonts.headlineLg }]}>
          {title}
        </Text>

        {hideRight ? (
          <View style={styles.iconBtn} />
        ) : rightAccessory ? (
          <View style={styles.iconBtn}>{rightAccessory}</View>
        ) : (
          <Link href="/settings" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              hitSlop={10}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
              <MaterialCommunityIcons name="cog-outline" size={24} color={palette.onSurfaceVariant} />
            </Pressable>
          </Link>
        )}
      </View>
    </View>
  );
}

/** The inner row height of the top bar (excludes the status-bar safe area). */
export const FIXED_TOP_BAR_HEIGHT = 56;

/**
 * Returns the total visual height of the FixedTopBar including the device's
 * status-bar inset — use this as `paddingTop` for scroll content.
 * Add your desired breathing gap on top: `useTopBarOffset() + 24`.
 */
export function useTopBarOffset(): number {
  const { top } = useSafeAreaInsets();
  return Math.max(top, 12) + FIXED_TOP_BAR_HEIGHT;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  row: {
    height: FIXED_TOP_BAR_HEIGHT,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
