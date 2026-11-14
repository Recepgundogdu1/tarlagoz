// Halka grafikler (react-native-svg ile çizilir).
//  - DonutChart   : masraf dağılımı gibi parçalı halka; açılışta saat yönünde dolar.
//  - ProgressRing : tek değerli ilerleme halkası (ör. teşhis güven oranı).
//
// Çizim tekniği: her dilim, aynı çemberin yalnızca bir bölümü boyanmış halidir.
// strokeDasharray boyalı uzunluğu, strokeDashoffset başlangıç noktasını belirler.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useCountUp } from '../../utils/motion';
import { colors } from '../../constants/theme';

// Dilimlerin sırayla alacağı renkler.
export const CHART_COLORS = [
  colors.primary,
  colors.wheat,
  colors.earth,
  colors.info,
  '#A2456B',
  '#7B4A8E',
  colors.warning,
  colors.textMuted,
];

const GAP = 3; // dilimler arasındaki boşluk (birim: çizim pikseli)

export function DonutChart({ segments, size = 180, thickness = 22, children = null }) {
  // 0 -> 1: halkanın açılış animasyonu
  const reveal = useCountUp(1, { duration: 1000 });

  const list = Array.isArray(segments) ? segments.filter((s) => s.value > 0) : [];
  const total = list.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let consumed = 0; // önceki dilimlerin kapladığı uzunluk

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* -90°: çizim saat 12 yönünden başlasın */}
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.earthLight}
            strokeWidth={thickness}
            fill="none"
          />
          {total > 0
            ? list.map((segment, index) => {
                const fullLength = (segment.value / total) * circumference;
                const start = consumed * reveal;
                consumed += fullLength;
                const visible = Math.max(0, fullLength * reveal - (list.length > 1 ? GAP : 0));
                if (visible <= 0) return null;
                return (
                  <Circle
                    key={segment.key}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={segment.color || CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={thickness}
                    strokeDasharray={`${visible} ${circumference - visible}`}
                    strokeDashoffset={-start}
                    strokeLinecap="butt"
                    fill="none"
                  />
                );
              })
            : null}
        </G>
      </Svg>
      {children ? <View style={styles.center}>{children}</View> : null}
    </View>
  );
}

export function ProgressRing({
  progress,
  size = 140,
  thickness = 14,
  color = colors.primary,
  trackColor = colors.earthLight,
  children = null,
}) {
  const target = Math.max(0, Math.min(1, Number(progress) || 0));
  const animated = useCountUp(target, { duration: 1100 });

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const visible = circumference * animated;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={trackColor}
            strokeWidth={thickness}
            fill="none"
          />
          {visible > 0 ? (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={color}
              strokeWidth={thickness}
              strokeDasharray={`${visible} ${circumference - visible}`}
              strokeLinecap="round"
              fill="none"
            />
          ) : null}
        </G>
      </Svg>
      {children ? <View style={styles.center}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
