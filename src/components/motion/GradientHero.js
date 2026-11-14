// Renk geçişli "kahraman" kart. Arkasında yavaşça süzülen daireler ve
// istenirse hafif bir 3D salınım (kart nefes alıyormuş gibi) bulunur.
// Özet panolarında (genel durum, net kâr) kullanılır.

import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLoop } from '../../utils/motion';
import { colors, radius, shadows, spacing } from '../../constants/theme';

const GRADIENTS = {
  green: [colors.primaryDeep, colors.primaryDark, '#236B3F'],
  earth: ['#3B2A1F', colors.earthDark, '#7A5A40'],
  danger: ['#4A1512', '#7E221C', '#A93226'],
};

// Arka planda süzülen yarı saydam daire.
function Blob({ size, top, left, right, bottom, loop, range }) {
  const translateY = loop.interpolate({ inputRange: [0, 1], outputRange: [0, range] });
  const translateX = loop.interpolate({ inputRange: [0, 1], outputRange: [0, -range / 2] });
  const scale = loop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.blob,
        { width: size, height: size, top, left, right, bottom },
        { transform: [{ translateX }, { translateY }, { scale }] },
      ]}
    />
  );
}

function GradientHero({ children, tone = 'green', sway = true, style = null }) {
  const slow = useLoop(5200);
  const slower = useLoop(7400);

  // 3D salınım: kart iki eksende birkaç derece ileri geri döner.
  const rotateX = slow.interpolate({ inputRange: [0, 1], outputRange: ['2.2deg', '-2.2deg'] });
  const rotateY = slower.interpolate({ inputRange: [0, 1], outputRange: ['-2.6deg', '2.6deg'] });
  const transform = sway ? [{ perspective: 1200 }, { rotateX }, { rotateY }] : [];

  return (
    <Animated.View style={[styles.shadowWrap, style, { transform }]}>
      <LinearGradient
        colors={GRADIENTS[tone] || GRADIENTS.green}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Blob size={190} top={-80} right={-60} loop={slow} range={16} />
        <Blob size={120} bottom={-50} left={-30} loop={slower} range={-14} />
        <Blob size={56} top={24} right={90} loop={slower} range={10} />
        <View>{children}</View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: { borderRadius: radius.xl, backgroundColor: colors.primaryDeep, ...shadows.lg },
  gradient: { borderRadius: radius.xl, padding: spacing.xl, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
});

export default React.memo(GradientHero);
