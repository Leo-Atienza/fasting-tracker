import { type ErrorBoundaryProps } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { FastCoachFonts, FastCoachPalette, type ColorSchemeName } from '@/constants/FastCoachTheme';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const scheme = (colorScheme === 'dark' ? 'dark' : 'light') as ColorSchemeName;
  const p = FastCoachPalette[scheme];

  const onRetry = useCallback(() => {
    void retry();
  }, [retry]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: p.background }]} edges={['top', 'bottom']}>
      <View style={styles.inner}>
        <Text
          style={[styles.title, { color: p.onSurface, fontFamily: FastCoachFonts.headlineLg }]}
          accessibilityRole="header">
          Something went wrong
        </Text>
        <Text style={[styles.msg, { color: p.onSurfaceVariant, fontFamily: FastCoachFonts.body }]}>
          {error.message}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: p.primary, opacity: pressed ? 0.88 : 1 },
          ]}>
          <Text style={{ color: p.onPrimary, fontFamily: FastCoachFonts.label, fontSize: 16 }}>
            Try again
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  msg: { fontSize: 15, lineHeight: 22 },
  btn: { alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
});
