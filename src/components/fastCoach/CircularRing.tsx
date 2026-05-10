import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

type Props = {
  size: number;
  stroke: number;
  progress: number; // 0..1
  trackColor: string;
  gradientStart: string;
  gradientEnd: string;
  /** Unique id when multiple Svg rings render (gradient URL). */
  svgGradientId?: string;
  children?: React.ReactNode;
};

/**
 * Stroke-based circular progress; center holds timer text via `children`.
 */
export function CircularRing({
  size,
  stroke,
  progress,
  trackColor,
  gradientStart,
  gradientEnd,
  svgGradientId = 'fcRingGrad',
  children,
}: Props) {
  const c = size / 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - clamped);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={svgGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientStart} />
            <Stop offset="100%" stopColor={gradientEnd} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke={`url(#${svgGradientId})`}
          strokeWidth={stroke + 2}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${c} ${c})`}
        />
      </Svg>
      {children}
    </View>
  );
}
