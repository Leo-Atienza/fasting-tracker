import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import type { FastCoachPalette } from '@/constants/FastCoachTheme';

type Props = ViewProps & {
  palette: FastCoachPalette;
  /** Soft glass tint behind the card. 'low' = transparent, 'high' = opaque-ish white. */
  tone?: 'low' | 'mid' | 'high';
  /** Disable BlurView (rare — for cards inside ScrollViews on Android where it can underdraw). */
  noBlur?: boolean;
  /** Override the corner radius — design uses 24/32px squircle shapes. */
  radius?: number;
};

const TONE_FILL: Record<'low' | 'mid' | 'high', { light: string; dark: string }> = {
  low: { light: 'rgba(255,255,255,0.50)', dark: 'rgba(46,48,52,0.55)' },
  mid: { light: 'rgba(255,255,255,0.68)', dark: 'rgba(46,48,52,0.70)' },
  high: { light: 'rgba(255,255,255,0.82)', dark: 'rgba(46,48,52,0.85)' },
};

/**
 * Glassmorphic surface that mirrors Stitch's design tokens:
 * - BlurView underlay on iOS/Android (degraded to translucent fill on web)
 * - 0.5px inner-glow border in white at 40% opacity
 * - Soft ambient shadow (Y10 blur20 @ 5%) for elevation
 */
export function GlassCard({
  palette,
  tone = 'mid',
  noBlur = false,
  radius = 24,
  style,
  children,
  ...rest
}: Props) {
  const isDark = palette.background === '#1a1c1f';
  const fillKey: 'light' | 'dark' = isDark ? 'dark' : 'light';
  const fill = TONE_FILL[tone][fillKey];

  const cardStyle: ViewStyle = {
    borderRadius: radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'web' ? fill : 'transparent',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        } as unknown as ViewStyle)
      : {
          shadowColor: '#000',
          shadowOpacity: 0.07,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
          elevation: 4,
        }),
  };

  const inner = (
    <View style={[styles.innerGlow, { borderColor: 'rgba(255,255,255,0.40)' }]} pointerEvents="box-none">
      {children}
    </View>
  );

  if (noBlur || Platform.OS === 'web') {
    return (
      <View {...rest} style={[cardStyle, style]}>
        {inner}
      </View>
    );
  }

  return (
    <View {...rest} style={[cardStyle, style]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 28 : 18}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} pointerEvents="none" />
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  innerGlow: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 24,
    margin: -StyleSheet.hairlineWidth,
  },
});
