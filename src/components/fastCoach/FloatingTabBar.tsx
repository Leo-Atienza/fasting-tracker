import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import type { ComponentProps } from 'react';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FastCoachFonts, FastCoachPalette, type ColorSchemeName } from '@/constants/FastCoachTheme';

type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const ICONS: readonly MciName[] = ['timer', 'water', 'chart-line-variant', 'lightbulb-outline'];

/** Custom glass tab bar wired from `(tabs)/_layout` with explicit color scheme from the host screen. */
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  colorScheme,
}: BottomTabBarProps & { colorScheme: ColorSchemeName }) {
  const palette = FastCoachPalette[colorScheme];
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.outer,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
      accessibilityRole="tablist">
      <BlurView
        intensity={Platform.select({ ios: 48, android: 28, web: 32 })}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={[styles.blur, { borderColor: palette.glassBorder }]}>
        <View style={[styles.inner, { backgroundColor: palette.glassFill }]}>
          {state.routes.map((route, index) => {
            const opts = descriptors[route.key]?.options ?? {};
            const label =
              opts.tabBarLabel !== undefined
                ? String(opts.tabBarLabel)
                : opts.title ?? route.name;
            const focused = state.index === index;
            const color = focused ? palette.primary : palette.outline;

            function onPress() {
              const e = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }

            const iconName: MciName = ICONS[index] ?? ('circle-outline' as MciName);

            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.tab,
                  focused && [
                    styles.tabActive,
                    {
                      backgroundColor:
                        colorScheme === 'dark' ? palette.surfaceContainerHigh : `${palette.primaryFixed}33`,
                    },
                  ],
                  pressed && { opacity: 0.92 },
                ]}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={26}
                  color={color}
                  accessibilityElementsHidden={true}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    { color },
                    focused && {
                      fontFamily: FastCoachFonts.label,
                      fontWeight: '600',
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
  blur: {
    width: '90%',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 22, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 14 },
      default: {},
    }),
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'stretch',
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    paddingVertical: Platform.OS === 'android' ? 6 : 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    minHeight: Platform.OS === 'web' ? 56 : undefined,
  },
  tabActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#53e16f',
        shadowOpacity: 0.38,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
      },
      default: {},
    }),
  },
  label: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.08 * 13,
    fontWeight: '600',
    marginTop: 2,
  },
});
