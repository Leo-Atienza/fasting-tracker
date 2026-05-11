import React, { useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';

import type { FastCoachPalette } from '@/constants/FastCoachTheme';

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  palette: FastCoachPalette;
  accentColor?: string;
  accessibilityLabel?: string;
};

/**
 * Lightweight horizontal slider — fills with a colored bar up to the current value
 * and exposes a pill-shaped thumb. Built from scratch (no native slider dep) so the
 * styling matches the rest of the glass design system exactly.
 */
export function TouchSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  palette,
  accentColor,
  accessibilityLabel,
}: Props) {
  const [width, setWidth] = useState(0);
  const accent = accentColor ?? palette.secondary;

  const clamped = Math.max(min, Math.min(max, value));
  const ratio = max > min ? (clamped - min) / (max - min) : 0;

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  function locateX(x: number): number {
    if (width <= 0) return clamped;
    const t = Math.max(0, Math.min(1, x / width));
    const raw = min + t * (max - min);
    const stepped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, stepped));
  }

  const responder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          onChange(locateX(e.nativeEvent.locationX));
        },
        onPanResponderMove: (e: GestureResponderEvent) => {
          onChange(locateX(e.nativeEvent.locationX));
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, min, max, step],
  );

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel ?? 'Adjustable slider'}
      accessibilityValue={{ min, max, now: clamped }}
      onLayout={onLayout}
      style={styles.touchArea}
      {...responder.panHandlers}>
      <View style={[styles.track, { backgroundColor: `${accent}26` }]}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: accent }]} />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            left: `${ratio * 100}%`,
            backgroundColor: '#fff',
            borderColor: accent,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    height: 36,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    marginLeft: -11,
    top: 7,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
