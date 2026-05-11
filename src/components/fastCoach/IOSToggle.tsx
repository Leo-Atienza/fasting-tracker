import React from 'react';
import { Animated, Pressable, StyleSheet, View, type AccessibilityProps } from 'react-native';

import type { FastCoachPalette } from '@/constants/FastCoachTheme';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

type Props = AccessibilityProps & {
  value: boolean;
  onValueChange: (next: boolean) => void;
  palette: FastCoachPalette;
};

/** iOS-styled switch — used for binary preferences (reminders, units, etc.). */
export function IOSToggle({ value, onValueChange, palette, ...a11y }: Props) {
  const reduceMotion = useReduceMotion();
  const anim = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    if (reduceMotion) {
      anim.setValue(value ? 1 : 0);
      return;
    }
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, friction: 8, tension: 120 }).start();
  }, [value, anim, reduceMotion]);

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [palette.surfaceContainerHigh, palette.primaryContainer],
  });
  const thumbTranslate = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={6}
      onPress={() => onValueChange(!value)}
      {...a11y}>
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX: thumbTranslate }] },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 999,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
