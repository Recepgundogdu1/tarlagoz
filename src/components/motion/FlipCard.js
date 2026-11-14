// 3D dönen kart. Dokununca kart dikey ekseni etrafında 180° döner ve arka
// yüzü görünür. Ön yüz kartın yüksekliğini belirler; arka yüz aynı alana sığar.

import React, { useCallback, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { hapticTap, prefersReducedMotion } from '../../utils/motion';

function FlipCard({ front, back, style = null, accessibilityLabel = 'Kartı çevir' }) {
  const [flipped, setFlipped] = useState(false);
  const progress = useRef(new Animated.Value(0)).current; // 0: ön yüz, 1: arka yüz

  const toggle = useCallback(() => {
    const next = !flipped;
    setFlipped(next);
    hapticTap();
    if (prefersReducedMotion()) {
      progress.setValue(next ? 1 : 0);
      return;
    }
    Animated.spring(progress, {
      toValue: next ? 1 : 0,
      friction: 9,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, [flipped, progress]);

  const frontRotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  // Kart yan döndüğü anda (yarı yol) yüzler yer değiştirir. Bazı Android
  // cihazlarda "arka yüzü gizle" özelliği güvenilir olmadığı için görünürlük
  // opaklıkla da kontrol edilir.
  const frontOpacity = progress.interpolate({
    inputRange: [0, 0.5, 0.501, 1],
    outputRange: [1, 1, 0, 0],
    extrapolate: 'clamp',
  });
  const backOpacity = progress.interpolate({
    inputRange: [0, 0.5, 0.501, 1],
    outputRange: [0, 0, 1, 1],
    extrapolate: 'clamp',
  });

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Ayrıntıyı görmek için dokunun"
      style={style}
    >
      <Animated.View
        style={[
          styles.face,
          { opacity: frontOpacity, transform: [{ perspective: 1000 }, { rotateY: frontRotate }] },
        ]}
      >
        {front}
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.face,
          styles.back,
          { opacity: backOpacity, transform: [{ perspective: 1000 }, { rotateY: backRotate }] },
        ]}
      >
        {back}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: { backfaceVisibility: 'hidden' },
  back: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});

export default React.memo(FlipCard);
