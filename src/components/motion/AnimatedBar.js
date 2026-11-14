// Soldan sağa dolan çubuk. percent: 0-100.
// Genişlik animasyonu yerel sürücüyle (native driver) yapılamadığı için
// JavaScript tarafında çalışır; kısa ve tek seferlik olduğundan sorun olmaz.

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { prefersReducedMotion } from '../../utils/motion';
import { colors, radius } from '../../constants/theme';

function AnimatedBar({
  percent,
  color = colors.earth,
  trackColor = colors.earthLight,
  height = 8,
  delay = 0,
  style = null,
}) {
  const target = Math.max(0, Math.min(100, Number(percent) || 0));
  const width = useRef(new Animated.Value(prefersReducedMotion() ? target : 0)).current;

  useEffect(() => {
    if (prefersReducedMotion()) {
      width.setValue(target);
      return undefined;
    }
    const animation = Animated.timing(width, {
      toValue: target,
      duration: 800,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [width, target, delay]);

  const animatedWidth = width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }, style]}>
      <Animated.View
        style={[styles.fill, { width: animatedWidth, backgroundColor: color }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.pill, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius.pill },
});

export default React.memo(AnimatedBar);
