import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  type Theme,
} from '@react-navigation/native';
import {
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import { Inter_300Light, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Redirect, Stack, useSegments } from 'expo-router';
import { useEffect, useMemo } from 'react';

import {
  FastCoachFonts,
  FastCoachPalette,
  type ColorSchemeName,
} from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { PersistErrorBanner } from '@/src/components/PersistErrorBanner';
import { useStoreHydrated } from '@/src/hooks/useStoreHydrated';
import { useAppStore } from '@/src/store/useAppStore';

export { ErrorBoundary } from './error';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

function navigationThemeFor(scheme: ColorSchemeName): Theme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const p = FastCoachPalette[scheme];

  return {
    ...base,
    dark: scheme === 'dark',
    colors: {
      ...base.colors,
      primary: p.primary,
      background: p.background,
      card: p.surfaceContainerLowest,
      text: p.onSurface,
      border: p.outlineVariant,
      notification: p.primaryContainer,
    },
  };
}

function NavigationGuard({ storeHydrated }: { storeHydrated: boolean }) {
  const segments = useSegments();
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  if (!storeHydrated) return null;
  const first = segments?.[0];
  const inOnboarding = first === 'onboarding';
  if (!hasCompletedOnboarding && !inOnboarding) return <Redirect href="/onboarding" />;
  if (hasCompletedOnboarding && inOnboarding) return <Redirect href="/" />;
  return null;
}

export default function RootLayout() {
  const hydrated = useStoreHydrated();
  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_600SemiBold,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (fontError) {
      SplashScreen.hideAsync().catch(() => {});
      throw fontError;
    }
  }, [fontError]);

  useEffect(() => {
    const id = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 6000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (fontsLoaded && hydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, hydrated]);

  if (!fontsLoaded || !hydrated) {
    return null;
  }

  return <RootLayoutNav storeHydrated={hydrated} />;
}

function RootLayoutNav({ storeHydrated }: { storeHydrated: boolean }) {
  const colorScheme = useColorScheme();
  const scheme = (colorScheme === 'dark' ? 'dark' : 'light') as ColorSchemeName;
  const p = FastCoachPalette[scheme];
  const navTheme = useMemo(() => navigationThemeFor(scheme), [scheme]);

  const stackHeader = useMemo(
    () => ({
      headerStyle: { backgroundColor: p.surfaceContainerLow },
      headerTintColor: p.primary,
      headerTitleStyle: {
        fontFamily: FastCoachFonts.headlineLg,
        fontSize: 18,
        fontWeight: '700' as const,
      },
      headerShadowVisible: false,
    }),
    [p.primary, p.surfaceContainerLow],
  );

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="auto" />
      <PersistErrorBanner />
      <NavigationGuard storeHydrated={storeHydrated} />
      <Stack screenOptions={stackHeader}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="history" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
