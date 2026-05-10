import React from 'react';
import { Tabs } from 'expo-router';

import { type ColorSchemeName } from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { FloatingTabBar } from '@/src/components/fastCoach/FloatingTabBar';

export default function TabLayout() {
  const colorScheme = (useColorScheme() ?? 'light') as ColorSchemeName;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} colorScheme={colorScheme} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Fast', tabBarLabel: 'Fast' }} />
      <Tabs.Screen name="water" options={{ title: 'Water', tabBarLabel: 'Water' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarLabel: 'Insights' }} />
      <Tabs.Screen name="facts" options={{ title: 'Facts', tabBarLabel: 'Facts' }} />
    </Tabs>
  );
}
