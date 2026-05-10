import React, { useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useReduceMotion } from '@/src/hooks/useReduceMotion';

type Props = PressableProps & {
  children: React.ReactNode;
  scaleTo?: number;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Lightweight tactile press effect for buttons/cards. Honors the OS-level
 * "reduce motion" accessibility flag: when on, the press doesn't scale at all
 * (instant identity transform) so motion-sensitive users aren't shaken.
 */
export function ScalePressable({
  children,
  scaleTo = 0.98,
  containerStyle,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  function animate(toValue: number) {
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }
    Animated.timing(scale, {
      toValue,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        animate(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animate(1);
        onPressOut?.(e);
      }}>
      <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

