import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { FastCoachPalette } from '@/constants/FastCoachTheme';
import { FastCoachFonts } from '@/constants/FastCoachTheme';

type Props = {
  children: string;
  palette: FastCoachPalette;
  tone?: 'muted' | 'primary' | 'secondary';
  align?: 'left' | 'center';
};

/** Uppercase eyebrow used to label sections — `FACT OF THE DAY`, `PREFERENCES`, … */
export function SectionLabel({ children, palette, tone = 'muted', align = 'left' }: Props) {
  const color =
    tone === 'primary' ? palette.primary : tone === 'secondary' ? palette.secondary : palette.onSurfaceVariant;
  return (
    <View style={[styles.wrap, align === 'center' && { alignItems: 'center' }]}>
      <Text style={[styles.text, { color, fontFamily: FastCoachFonts.label }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 4, marginBottom: 6 },
  text: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
});
