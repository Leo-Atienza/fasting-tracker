import React from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import type { FastCoachPalette } from '@/constants/FastCoachTheme';

type Props = ViewProps & {
  palette: FastCoachPalette;
};

/** Translucent elevated surface approximating Stitch glass panels. */
export function GlassCard({ palette, style, children, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[
        styles.card,
        {
          backgroundColor: palette.glassFill,
          borderColor: palette.glassBorder,
          ...(Platform.OS === 'web'
            ? ({ boxShadow: '0px 14px 32px rgba(0,0,0,0.06)' } as object)
            : {
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 10 },
              }),
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
});
