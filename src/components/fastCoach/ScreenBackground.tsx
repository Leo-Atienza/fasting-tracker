import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { FastCoachPalette } from '@/constants/FastCoachTheme';

/** Per-screen accent for the corner blobs (green-tilted, blue-tilted, violet-tilted). */
export type ScreenAccent = 'fast' | 'water' | 'facts' | 'history' | 'settings' | 'onboarding' | 'insights';

type BlobRole = 'green' | 'blue' | 'violet';

type Props = {
  palette: FastCoachPalette;
  accent?: ScreenAccent;
  children?: React.ReactNode;
};

const ACCENTS: Record<ScreenAccent, { top: BlobRole; bottom: BlobRole }> = {
  fast: { top: 'green', bottom: 'green' },
  water: { top: 'blue', bottom: 'blue' },
  facts: { top: 'green', bottom: 'violet' },
  insights: { top: 'green', bottom: 'blue' },
  history: { top: 'green', bottom: 'green' },
  settings: { top: 'violet', bottom: 'blue' },
  onboarding: { top: 'green', bottom: 'blue' },
};

function blobColor(palette: FastCoachPalette, role: BlobRole): string {
  if (role === 'green') return palette.meshGreen;
  if (role === 'blue') return palette.meshBlue;
  return 'rgba(166,165,255,0.18)';
}

/** Single radial-gradient blob layer pinned to a corner of the screen. */
function Blob({
  id,
  color,
  size,
  position,
  intensity,
}: {
  id: string;
  color: string;
  size: number;
  position: ViewStyle;
  /** Multiplies the center stop's opacity. */
  intensity: number;
}) {
  return (
    <View style={[styles.blobWrap, position, { width: size, height: size }]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
            <Stop offset="0" stopColor={color} stopOpacity={intensity} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/**
 * Layered backdrop matching Stitch "High-Performance Zen": a nearly-flat
 * off-white linear gradient base plus two subtle radial-gradient blobs at
 * opposite corners. The blobs read as gentle light bleed rather than visible
 * discs — pushed far enough off-frame that only the soft falloff is on-screen.
 *
 * Previously rendered three blobs at 0.7–0.85 intensity, which made the field
 * feel busy. The current pass softens the gradient stops toward
 * `palette.background` and drops blob intensity to 0.45 / 0.55, matching the
 * Stitch reference `linear-gradient(135deg, #f9f9fe 0%, #ededf2 100%)`.
 */
export function ScreenBackground({ palette, accent = 'fast', children }: Props) {
  const conf = ACCENTS[accent];
  const topColor = blobColor(palette, conf.top);
  const bottomColor = blobColor(palette, conf.bottom);

  return (
    <LinearGradient
      colors={[palette.background, palette.surface, palette.surfaceContainerLow]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}>
      <View style={styles.mesh} pointerEvents="none">
        <Blob
          id={`bgblob-${accent}-tl`}
          color={topColor}
          size={420}
          position={{ top: -180, left: -140 }}
          intensity={0.45}
        />
        <Blob
          id={`bgblob-${accent}-br`}
          color={bottomColor}
          size={460}
          position={{ bottom: -220, right: -160 }}
          intensity={0.55}
        />
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  mesh: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  blobWrap: { position: 'absolute' },
});
