import React from 'react';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { type ColorSchemeName } from '@/constants/FastCoachTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { FloatingTabBar } from '@/src/components/fastCoach/FloatingTabBar';

export default function TabLayout() {
  const colorScheme = (useColorScheme() ?? 'light') as ColorSchemeName;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} colorScheme={colorScheme} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Fast', tabBarLabel: 'Fast' }} />
      <Tabs.Screen name="water" options={{ title: 'Water', tabBarLabel: 'Water' }} />
      <Tabs.Screen name="facts" options={{ title: 'Facts', tabBarLabel: 'Facts' }} />
    </Tabs>
  );
}
