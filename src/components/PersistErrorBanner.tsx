import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FastCoachFonts, FastCoachPalette, type ColorSchemeName } from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import {
  clearPersistWriteError,
  getPersistWriteError,
  subscribePersistWriteErrors,
} from '@/src/storage/persistWriteErrors';

/**
 * Shown when AsyncStorage persist writes fail (e.g. quota). Dismiss clears the local flag — data may still be out of sync until resolved.
 */
export function PersistErrorBanner() {
  const colorScheme = useColorScheme() ?? 'light';
  const scheme = (colorScheme === 'dark' ? 'dark' : 'light') as ColorSchemeName;
  const palette = FastCoachPalette[scheme];
  const [error, setError] = useState(() => getPersistWriteError());

  useEffect(() => {
    return subscribePersistWriteErrors(() => {
      setError(getPersistWriteError());
    });
  }, []);

  if (!error) return null;

  return (
    <View
      style={[styles.wrap, { backgroundColor: palette.secondaryContainer }]}>
      <Text style={[styles.text, { color: palette.onSecondaryContainer, fontFamily: FastCoachFonts.body }]}>
          Could not save to device storage. Your latest change may be lost after closing the app.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss storage warning"
        onPress={() => {
          clearPersistWriteError();
          setError(null);
        }}
        style={({ pressed }) => [styles.dismiss, { opacity: pressed ? 0.7 : 1 }]}>
        <Text style={[styles.dismissLabel, { color: palette.primary, fontFamily: FastCoachFonts.label }]}>
          Dismiss
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.12)',
  },
  text: { fontSize: 14, lineHeight: 20 },
  dismiss: { alignSelf: 'flex-start' },
  dismissLabel: { fontSize: 14, fontWeight: '600' },
});
