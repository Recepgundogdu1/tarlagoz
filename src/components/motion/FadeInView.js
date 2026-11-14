// Giriş animasyonlu sarmalayıcı: içeriği aşağıdan kayarak ve belirerek gösterir.
// "index" verilirse liste öğeleri sırayla (kademeli) belirir.

import React from 'react';
import { Animated } from 'react-native';
import { useEntrance } from '../../utils/motion';

const STEP_MS = 70; // öğeler arası gecikme
const MAX_STEPS = 8; // uzun listelerde gecikme birikmesin

function FadeInView({ children, index = 0, delay = 0, distance = 18, style = null }) {
  const entrance = useEntrance({
    delay: delay + Math.min(index, MAX_STEPS) * STEP_MS,
    distance,
  });
  return <Animated.View style={[entrance, style]}>{children}</Animated.View>;
}

export default React.memo(FadeInView);
