// 3D eğilen kart. Karta basıldığında, parmağın değdiği köşe ekranın içine
// doğru gömülür; bırakınca yay gibi geri döner. Derinlik hissi "perspective"
// dönüşümüyle sağlanır.
//
// Kaydırmayı engellememek için sürükleme değil yalnızca basma anı kullanılır.

import React, { useCallback, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { hapticTap, prefersReducedMotion } from '../../utils/motion';

function clamp(value) {
  return Math.max(-1, Math.min(1, value));
}

function TiltCard({
  children,
  onPress,
  style = null,
  maxTilt = 7,
  accessibilityLabel = undefined,
  disabled = false,
}) {
  const wrapperRef = useRef(null);
  const tiltX = useRef(new Animated.Value(0)).current; // -1..1 (yukarı/aşağı eğim)
  const tiltY = useRef(new Animated.Value(0)).current; // -1..1 (sola/sağa eğim)
  const scale = useRef(new Animated.Value(1)).current;

  const springTo = useCallback(
    (x, y, s) => {
      const config = { useNativeDriver: true, speed: 18, bounciness: 9 };
      Animated.parallel([
        Animated.spring(tiltX, { toValue: x, ...config }),
        Animated.spring(tiltY, { toValue: y, ...config }),
        Animated.spring(scale, { toValue: s, ...config }),
      ]).start();
    },
    [tiltX, tiltY, scale]
  );

  const handlePressIn = useCallback(
    (event) => {
      if (prefersReducedMotion()) return;
      const { pageX, pageY } = event.nativeEvent;
      const node = wrapperRef.current;
      if (!node || typeof node.measureInWindow !== 'function') {
        springTo(0, 0, 0.98);
        return;
      }
      // Kartın ekrandaki konumunu ölçüp dokunuşun kart içindeki yerini buluyoruz.
      node.measureInWindow((x, y, width, height) => {
        if (!width || !height) {
          springTo(0, 0, 0.98);
          return;
        }
        const horizontal = clamp(((pageX - x) / width - 0.5) * 2); // -1 sol, +1 sağ
        const vertical = clamp(((pageY - y) / height - 0.5) * 2); // -1 üst, +1 alt
        // Üste basılınca üst kenar geriye (rotateX +), sağa basılınca sağ kenar geriye (rotateY +).
        springTo(-vertical, horizontal, 0.98);
      });
    },
    [springTo]
  );

  const handlePressOut = useCallback(() => {
    springTo(0, 0, 1);
  }, [springTo]);

  const handlePress = useCallback(() => {
    hapticTap();
    if (onPress) onPress();
  }, [onPress]);

  const rotateX = tiltX.interpolate({
    inputRange: [-1, 1],
    outputRange: [`-${maxTilt}deg`, `${maxTilt}deg`],
  });
  const rotateY = tiltY.interpolate({
    inputRange: [-1, 1],
    outputRange: [`-${maxTilt}deg`, `${maxTilt}deg`],
  });

  return (
    // collapsable={false}: Android'de ölçüm yapılabilmesi için görünüm korunur.
    <View ref={wrapperRef} collapsable={false}>
      <Animated.View
        style={{ transform: [{ perspective: 900 }, { rotateX }, { rotateY }, { scale }] }}
      >
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={style}
        >
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default React.memo(TiltCard);
