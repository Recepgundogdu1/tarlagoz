// Dikkat çekme animasyonları.
//  - ShakeView : ekrana gelince bir kez sağa sola sallanır (zarar uyarısı gibi).
//  - FloatView : içeriği yavaşça yukarı aşağı süzdürür (boş durum simgeleri).

import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { hapticWarning, prefersReducedMotion, useLoop } from '../../utils/motion';

export function ShakeView({ children = null, style = null, haptic = false }) {
  const offset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    if (haptic) hapticWarning();
    const step = (toValue) =>
      Animated.timing(offset, {
        toValue,
        duration: 70,
        easing: Easing.linear,
        useNativeDriver: true,
      });
    const animation = Animated.sequence([
      Animated.delay(350),
      step(8),
      step(-8),
      step(6),
      step(-6),
      step(3),
      step(0),
    ]);
    animation.start();
    return () => animation.stop();
  }, [offset, haptic]);

  return (
    <Animated.View style={[style, { transform: [{ translateX: offset }] }]}>
      {children}
    </Animated.View>
  );
}

export function FloatView({ children = null, style = null, distance = 8, duration = 2200 }) {
  const loop = useLoop(duration);
  const translateY = loop.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });
  return (
    <Animated.View style={[style, { transform: [{ translateY }] }]}>{children}</Animated.View>
  );
}
