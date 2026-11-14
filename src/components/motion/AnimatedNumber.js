// Sayarak artan sayı. "formatter" her karede o anki değeri metne çevirir
// (ör. formatTL). Değer değişince eski değerden yenisine doğru sayar.

import React from 'react';
import { Text } from 'react-native';
import { useCountUp } from '../../utils/motion';

function AnimatedNumber({ value, formatter, duration = 900, ...textProps }) {
  const current = useCountUp(value, { duration });
  // Ekran okuyucu ara değerleri değil, son değeri okusun.
  return (
    <Text accessibilityLabel={formatter(value)} {...textProps}>
      {formatter(current)}
    </Text>
  );
}

export default React.memo(AnimatedNumber);
