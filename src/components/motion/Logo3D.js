// 3D logo: yaprak simgeli altın karo, iki eksende yavaşça dönerek süzülür.
// Arkasında dışa doğru yayılan halkalar bulunur. Giriş ve açılış ekranlarında
// kullanılır.

import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLoop, useRepeat } from '../../utils/motion';
import { colors, shadows } from '../../constants/theme';

// Dışa doğru büyüyüp kaybolan halka.
function PulseRing({ size, progress, color }) {
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const opacity = progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.35, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2, borderColor: color },
        { opacity, transform: [{ scale }] },
      ]}
    />
  );
}

function Logo3D({ size = 84, ringColor = colors.wheat }) {
  const swayY = useLoop(2600);
  const swayX = useLoop(3400);
  const float = useLoop(2200);
  const ringA = useRepeat(2600);
  const ringB = useRepeat(2600, 1300);

  const rotateY = swayY.interpolate({ inputRange: [0, 1], outputRange: ['-32deg', '32deg'] });
  const rotateX = swayX.interpolate({ inputRange: [0, 1], outputRange: ['14deg', '-14deg'] });
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  // Yere düşen gölge: logo yükseldikçe küçülür ve solar.
  const shadowScale = float.interpolate({ inputRange: [0, 1], outputRange: [1, 0.78] });
  const shadowOpacity = float.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.14] });

  return (
    <View style={[styles.wrapper, { width: size * 2, height: size * 1.9 }]}>
      <PulseRing size={size} progress={ringA} color={ringColor} />
      <PulseRing size={size} progress={ringB} color={ringColor} />

      <Animated.View
        style={{ transform: [{ perspective: 700 }, { translateY }, { rotateX }, { rotateY }] }}
      >
        <LinearGradient
          colors={['#F2CC6B', colors.wheat, '#B98A26']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.tile, { width: size, height: size, borderRadius: size * 0.28 }]}
        >
          {/* Üst kenardaki ışık yansıması */}
          <View style={[styles.shine, { borderRadius: size * 0.22 }]} />
          <Ionicons name="leaf" size={size * 0.5} color={colors.primaryDeep} />
        </LinearGradient>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.groundShadow,
          { width: size * 0.7, opacity: shadowOpacity, transform: [{ scaleX: shadowScale }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 2 },
  tile: { alignItems: 'center', justifyContent: 'center', ...shadows.lg },
  shine: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    height: '42%',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  groundShadow: {
    position: 'absolute',
    bottom: 6,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#000',
  },
});

export default React.memo(Logo3D);
