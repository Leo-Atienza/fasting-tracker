import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import type { ComponentProps } from 'react';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FastCoachFonts, FastCoachPalette, type ColorSchemeName } from '@/constants/FastCoachTheme';

type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type IconPair = { active: MciName; idle: MciName };

const ICONS: Record<string, IconPair> = {
  index: { active: 'timer', idle: 'timer-outline' },
  water: { active: 'water', idle: 'water-outline' },
  insights: { active: 'chart-line', idle: 'chart-line-variant' },
  facts: { active: 'lightbulb-on', idle: 'lightbulb-outline' },
};

/** Glass capsule tab bar matching the Stitch "High-Performance Zen" mobile pattern. */
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  colorScheme,
}: BottomTabBarProps & { colorScheme: ColorSchemeName }) {
  const palette = FastCoachPalette[colorScheme];
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  return (
    <View
      pointerEvents="box-none"
      style={[styles.outer, { paddingBottom: Math.max(insets.bottom + 4, 14) }]}
      accessibilityRole="tablist">
      <View style={styles.shadowFrame}>
        <BlurView
          intensity={Platform.select({ ios: 60, android: 32, web: 0 })}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.blur, { borderColor: palette.glassBorder }]}>
          <View
            style={[
              styles.inner,
              { backgroundColor: isDark ? 'rgba(30,32,36,0.65)' : 'rgba(255,255,255,0.55)' },
            ]}>
            {state.routes.map((route, index) => {
              const opts = descriptors[route.key]?.options ?? {};
              const label =
                opts.tabBarLabel !== undefined
                  ? String(opts.tabBarLabel)
                  : opts.title ?? route.name;
              const focused = state.index === index;
              const tone = focused ? palette.primary : palette.outline;
              const icons: IconPair = ICONS[route.name] ?? { active: 'circle', idle: 'circle-outline' };
              const iconName = focused ? icons.active : icons.idle;

              function onPress() {
                const e = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
              }

              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={typeof label === 'string' ? label : route.name}
                  onPress={onPress}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.tab,
                    focused && [
                      styles.tabActive,
                      {
                        backgroundColor: isDark
                          ? 'rgba(83,225,111,0.18)'
                          : 'rgba(114,254,136,0.22)',
                      },
                    ],
                    pressed && { opacity: 0.88, transform: [{ scale: 0.96 }] },
                  ]}>
                  <MaterialCommunityIcons
                    name={iconName}
                    size={22}
                    color={tone}
                    accessibilityElementsHidden={true}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.label,
                      {
                        color: tone,
                        fontFamily: focused ? FastCoachFonts.label : FastCoachFonts.body,
                      },
                    ]}>
                    {typeof label === 'string' ? label : route.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  shadowFrame: {
    width: '90%',
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.14,
        shadowRadius: 26,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 16 },
      default: ({
        boxShadow: '0 16px 32px rgba(0,0,0,0.08)',
      } as object),
    }),
  },
  blur: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 999,
    minHeight: 52,
  },
  tabActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#53e16f',
        shadowOpacity: 0.45,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
      },
      default: {},
    }),
  },
  label: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: '700',
    marginTop: 2,
  },
});
