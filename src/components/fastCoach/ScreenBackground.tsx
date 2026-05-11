import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { FastCoachPalette } from '@/constants/FastCoachTheme';

/** Per-screen accent for the corner blobs (green-tilted, blue-tilted, violet-tilted). */
export type ScreenAccent = 'fast' | 'water' | 'facts' | 'history' | 'settings' | 'onboarding' | 'insights';

type Props = {
  palette: FastCoachPalette;
  accent?: ScreenAccent;
  children?: React.ReactNode;
};

const ACCENTS: Record<ScreenAccent, { top: 'green' | 'blue' | 'violet'; bottom: 'green' | 'blue' | 'violet' }> = {
  fast: { top: 'green', bottom: 'green' },
  water: { top: 'blue', bottom: 'blue' },
  facts: { top: 'green', bottom: 'violet' },
  insights: { top: 'green', bottom: 'blue' },
  history: { top: 'green', bottom: 'green' },
  settings: { top: 'violet', bottom: 'blue' },
  onboarding: { top: 'green', bottom: 'blue' },
};

function blobColor(palette: FastCoachPalette, role: 'green' | 'blue' | 'violet'): string {
  if (role === 'green') return palette.meshGreen;
  if (role === 'blue') return palette.meshBlue;
  return 'rgba(166,165,255,0.18)';
}

/**
 * Layered backdrop matching Stitch "High-Performance Zen":
 * a subtle gradient base + 3 soft radial-like blobs at corners.
 */
export function ScreenBackground({ palette, accent = 'fast', children }: Props) {
  const conf = ACCENTS[accent];
  return (
    <LinearGradient
      colors={[palette.background, palette.surfaceContainerLow, palette.surfaceContainer]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}>
      <View style={styles.mesh} pointerEvents="none">
        <View
          style={[
            styles.blob,
            styles.topLeft,
            { backgroundColor: blobColor(palette, conf.top) },
          ]}
        />
        <View
          style={[
            styles.blob,
            styles.topRight,
            { backgroundColor: blobColor(palette, conf.top === 'green' ? 'blue' : 'green') },
          ]}
        />
        <View
          style={[
            styles.blob,
            styles.bottomRight,
            { backgroundColor: blobColor(palette, conf.bottom) },
          ]}
        />
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  mesh: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.9,
  },
  topLeft: {
    width: 320,
    height: 320,
    top: -120,
    left: -80,
    opacity: 0.65,
  },
  topRight: {
    width: 260,
    height: 260,
    top: -100,
    right: -70,
    opacity: 0.55,
  },
  bottomRight: {
    width: 360,
    height: 360,
    bottom: -160,
    right: -100,
    opacity: 0.65,
  },
});
