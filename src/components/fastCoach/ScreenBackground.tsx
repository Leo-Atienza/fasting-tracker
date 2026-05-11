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
  intensity = 1,
}: {
  id: string;
  color: string;
  size: number;
  position: ViewStyle;
  /** Multiplies the center stop's opacity — preserves the previous solid-blob density profile. */
  intensity?: number;
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
 * Layered backdrop matching Stitch "High-Performance Zen":
 * a subtle linear-gradient base + three radial-gradient mesh blobs pinned
 * off-frame at the corners. The radial falloff replaces the previous solid-
 * circle approach so the corners feel like light bleed instead of flat
 * stickers.
 */
export function ScreenBackground({ palette, accent = 'fast', children }: Props) {
  const conf = ACCENTS[accent];
  const topColor = blobColor(palette, conf.top);
  const altTopColor = blobColor(palette, conf.top === 'green' ? 'blue' : 'green');
  const bottomColor = blobColor(palette, conf.bottom);

  return (
    <LinearGradient
      colors={[palette.background, palette.surfaceContainerLow, palette.surfaceContainer]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}>
      <View style={styles.mesh} pointerEvents="none">
        <Blob
          id={`bgblob-${accent}-tl`}
          color={topColor}
          size={320}
          position={{ top: -120, left: -80 }}
          intensity={0.85}
        />
        <Blob
          id={`bgblob-${accent}-tr`}
          color={altTopColor}
          size={260}
          position={{ top: -100, right: -70 }}
          intensity={0.7}
        />
        <Blob
          id={`bgblob-${accent}-br`}
          color={bottomColor}
          size={360}
          position={{ bottom: -160, right: -100 }}
          intensity={0.85}
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
