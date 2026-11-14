// Tarla listesindeki kart: ürün ikonu, ad, ürün/dönüm/sezon, toplam masraf,
// tahmini net kâr (kâr/zarar rozetiyle) ve kısa hava özeti.
// Kart listeye sırayla kayarak girer ve basınca 3D olarak eğilir.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WeatherBadge from './WeatherBadge';
import FadeInView from './motion/FadeInView';
import TiltCard from './motion/TiltCard';
import AnimatedNumber from './motion/AnimatedNumber';
import { getCrop } from '../constants/crops';
import { getCropVisual } from '../constants/cropVisuals';
import { formatDonum, formatTL } from '../utils/format';
import { card, colors, font, radius, spacing, weight } from '../constants/theme';

function FieldCard({ field, summary, weather = null, onPress, index = 0 }) {
  const crop = getCrop(field.crop);
  const visual = getCropVisual(field.crop);
  const isLoss = summary ? summary.isLoss : false;

  return (
    <FadeInView index={index}>
    <TiltCard
      style={styles.card}
      onPress={() => onPress(field)}
      accessibilityLabel={`${field.name}, ${crop.label}, ${formatDonum(field.area)}`}
    >
      {/* Sol kenardaki ürün rengi şeridi */}
      <View style={[styles.accent, { backgroundColor: visual.color }]} />

      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <View style={[styles.iconCircle, { backgroundColor: `${visual.color}22` }]}>
            <Ionicons name={visual.icon} size={22} color={visual.color} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.name} numberOfLines={1}>
              {field.name}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {crop.label} · {formatDonum(field.area)} · {field.season}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
        </View>

        {summary ? (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Toplam masraf</Text>
              <Text style={styles.statValue}>{formatTL(summary.totalExpense)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Tahmini net kâr</Text>
              <View style={styles.profitRow}>
                <Ionicons
                  name={isLoss ? 'trending-down' : 'trending-up'}
                  size={18}
                  color={isLoss ? colors.danger : colors.primary}
                />
                <AnimatedNumber
                  value={summary.netProfit}
                  formatter={formatTL}
                  style={[styles.statValue, styles.profitValue, isLoss ? styles.loss : styles.profit]}
                />
              </View>
            </View>
          </View>
        ) : null}

        <WeatherBadge weather={weather} compact />
      </View>
    </TiltCard>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  card: { ...card, padding: 0, flexDirection: 'row', overflow: 'hidden', marginBottom: spacing.md },
  accent: { width: 5 },
  inner: { flex: 1, padding: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  titleBlock: { flex: 1 },
  name: { fontSize: font.lg, fontWeight: weight.heavy, color: colors.text },
  sub: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: { flex: 1 },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border, marginHorizontal: spacing.md },
  statLabel: { fontSize: font.xs, color: colors.textMuted, fontWeight: weight.medium },
  statValue: { fontSize: font.lg, fontWeight: weight.bold, color: colors.text, marginTop: 2 },
  profitRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  profitValue: { marginTop: 0, marginLeft: spacing.xs },
  profit: { color: colors.primary },
  loss: { color: colors.danger },
});

// React.memo: listedeki bir kartın verisi değişmediyse yeniden çizilmez.
export default React.memo(FieldCard);
