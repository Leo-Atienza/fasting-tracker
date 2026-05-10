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
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';

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

SplashScreen.preventAutoHideAsync();

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
  const router = useRouter();
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    if (!storeHydrated) return;
    if (!segments?.length) return;
    const first = segments[0];
    const inOnboarding = first === 'onboarding';

    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }
    if (hasCompletedOnboarding && inOnboarding) {
      router.replace('/');
    }
  }, [hasCompletedOnboarding, storeHydrated, router, segments]);

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
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && hydrated) {
      void SplashScreen.hideAsync();
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
      <PersistErrorBanner />
      <NavigationGuard storeHydrated={storeHydrated} />
      <Stack screenOptions={stackHeader}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="history" options={{ title: 'Fasting Tracker', headerBackTitle: '' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </ThemeProvider>
  );
}
