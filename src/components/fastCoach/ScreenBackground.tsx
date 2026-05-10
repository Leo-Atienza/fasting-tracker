import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { FastCoachPalette } from '@/constants/FastCoachTheme';

type Props = {
  palette: FastCoachPalette;
  children?: React.ReactNode;
};

/** Layer-0 gradient + soft mesh blobs (Stitch backgrounds). */
export function ScreenBackground({ palette, children }: Props) {
  return (
    <LinearGradient
      colors={[palette.background, palette.surfaceContainer]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}>
      <View style={styles.mesh} pointerEvents="none">
        <View style={[styles.blob, styles.blobGreen, { backgroundColor: palette.meshGreen }]} />
        <View style={[styles.blob, styles.blobBlue, { backgroundColor: palette.meshBlue }]} />
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
    opacity: 0.95,
    transform: [{ scale: 1 }],
  },
  blobGreen: {
    width: 280,
    height: 260,
    top: -70,
    left: -60,
    opacity: 0.85,
  },
  blobBlue: {
    width: 300,
    height: 280,
    bottom: -90,
    right: -70,
    opacity: 0.75,
  },
});
