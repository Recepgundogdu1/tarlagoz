// Kâr panosu: renk geçişli 3D özet kartında net kâr/zarar ve kâr marjı,
// altında masraf/gelir kutucukları ve başabaş fiyatı göstergesi.
// Rakamlar sayarak artar; başabaş kartı dokununca 3D dönerek hesabı gösterir.
// "summary" nesnesi utils/calculations.js içindeki calculateProfit çıktısıdır.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientHero from './motion/GradientHero';
import AnimatedNumber from './motion/AnimatedNumber';
import AnimatedBar from './motion/AnimatedBar';
import FadeInView from './motion/FadeInView';
import FlipCard from './motion/FlipCard';
import { ShakeView } from './motion/Attention';
import { formatKg, formatTL } from '../utils/format';
import { card, colors, font, radius, spacing, weight } from '../constants/theme';

function Tile({ icon, label, value, formatter, index }) {
  return (
    <FadeInView index={index} delay={150} style={styles.tile}>
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={18} color={colors.primaryDark} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
      <AnimatedNumber
        value={value}
        formatter={formatter}
        style={styles.tileValue}
        numberOfLines={1}
        adjustsFontSizeToFit
      />
    </FadeInView>
  );
}

function ProfitSummary({ summary }) {
  if (!summary) return null;
  const { isLoss, breakEvenPrice, pricePerKg } = summary;

  // Kâr marjı: net kâr / tahmini gelir
  const margin =
    summary.estimatedRevenue > 0 ? Math.round((summary.netProfit / summary.estimatedRevenue) * 100) : null;

  // Başabaş göstergesi: tahmini satış fiyatı başabaş fiyatının ne kadar üstünde/altında?
  const hasBreakEven = breakEvenPrice !== null && breakEvenPrice > 0 && pricePerKg > 0;
  const ratio = hasBreakEven ? pricePerKg / breakEvenPrice : 0;
  // Çubuk: başabaş = %50 noktası; 2 katı ve üstü tam dolu.
  const barPercent = hasBreakEven ? Math.max(4, Math.min(100, ratio * 50)) : 0;
  const safetyPercent = hasBreakEven ? Math.round((ratio - 1) * 100) : null;

  return (
    <View>
      {/* Özet (hero) kart */}
      <GradientHero tone={isLoss ? 'danger' : 'green'} style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>{isLoss ? 'TAHMİNİ NET ZARAR' : 'TAHMİNİ NET KÂR'}</Text>
          {margin !== null ? (
            <View style={[styles.marginPill, isLoss ? styles.marginPillLoss : styles.marginPillProfit]}>
              <Ionicons
                name={isLoss ? 'trending-down' : 'trending-up'}
                size={14}
                color={isLoss ? '#FFB4AB' : '#B9F0C3'}
              />
              <Text style={[styles.marginText, { color: isLoss ? '#FFB4AB' : '#B9F0C3' }]}>
                %{Math.abs(margin)} marj
              </Text>
            </View>
          ) : null}
        </View>
        <AnimatedNumber
          value={summary.netProfit}
          formatter={formatTL}
          duration={1100}
          style={[styles.heroValue, isLoss && styles.heroValueLoss]}
          numberOfLines={1}
          adjustsFontSizeToFit
        />
        <Text style={styles.heroSub}>Dönüm başı {formatTL(summary.profitPerDonum)}</Text>
      </GradientHero>

      {isLoss ? (
        <ShakeView style={styles.lossCard} haptic>
          <Ionicons name="warning" size={24} color={colors.danger} />
          <View style={styles.lossTextBlock}>
            <Text style={styles.lossTitle}>Bu tarla şu an zararda</Text>
            <Text style={styles.lossBody}>
              Tahmini zarar {formatTL(Math.abs(summary.netProfit))}.
              {breakEvenPrice !== null
                ? ` Zarar etmemek için ürünün kilosunu en az ${formatTL(breakEvenPrice, 2)} fiyata satmalısınız.`
                : ''}
            </Text>
          </View>
        </ShakeView>
      ) : null}

      {/* Kutucuklar */}
      <View style={styles.grid}>
        <Tile icon="wallet-outline" label="Toplam masraf" value={summary.totalExpense} formatter={formatTL} index={0} />
        <Tile icon="resize-outline" label="Dönüm başı maliyet" value={summary.costPerDonum} formatter={formatTL} index={1} />
      </View>
      <View style={styles.grid}>
        <Tile icon="basket-outline" label="Tahmini hasat" value={summary.estimatedHarvest} formatter={formatKg} index={2} />
        <Tile icon="cash-outline" label="Tahmini gelir" value={summary.estimatedRevenue} formatter={formatTL} index={3} />
      </View>

      {/* Başabaş fiyatı: dokununca 3D dönerek hesabın nasıl yapıldığını gösterir */}
      {hasBreakEven ? (
        <FlipCard
          style={styles.flip}
          accessibilityLabel={`Başabaş fiyatı ${formatTL(breakEvenPrice, 2)} kilogram başına`}
          front={
            <View style={styles.breakEvenCard}>
              <View style={styles.breakEvenHeader}>
                <Ionicons name="scale-outline" size={20} color={colors.wheat} />
                <Text style={styles.breakEvenLabel}>BAŞABAŞ FİYATI</Text>
                <View style={styles.flipHint}>
                  <Ionicons name="sync-outline" size={14} color={colors.earthLight} />
                  <Text style={styles.flipHintText}>Çevir</Text>
                </View>
              </View>
              <Text style={styles.breakEvenValue}>{formatTL(breakEvenPrice, 2)} / kg</Text>
              <View style={styles.meterBlock}>
                <View>
                  <AnimatedBar
                    percent={barPercent}
                    height={10}
                    delay={300}
                    color={ratio >= 1 ? '#7BD88F' : '#FF8A80'}
                    trackColor="rgba(255,255,255,0.15)"
                  />
                  <View style={styles.meterMark} />
                </View>
                <Text style={styles.breakEvenHint} numberOfLines={2}>
                  Tahmini satış fiyatınız {formatTL(pricePerKg, 2)} / kg —{' '}
                  {safetyPercent >= 0
                    ? `başabaşın %${safetyPercent} üstünde.`
                    : `başabaşın %${Math.abs(safetyPercent)} altında.`}
                </Text>
              </View>
            </View>
          }
          back={
            <View style={[styles.breakEvenCard, styles.breakEvenBack]}>
              <Text style={styles.breakEvenLabelBack}>NASIL HESAPLANDI?</Text>
              <Text style={styles.formula} numberOfLines={1} adjustsFontSizeToFit>
                Toplam masraf ÷ Tahmini hasat
              </Text>
              <Text style={styles.formulaNumbers} numberOfLines={1} adjustsFontSizeToFit>
                {formatTL(summary.totalExpense)} ÷ {formatKg(summary.estimatedHarvest)}
              </Text>
              <Text style={styles.formulaResult}>= {formatTL(breakEvenPrice, 2)} / kg</Text>
            </View>
          }
        />
      ) : (
        <View style={[styles.breakEvenCard, styles.flip]}>
          <View style={styles.breakEvenHeader}>
            <Ionicons name="scale-outline" size={20} color={colors.wheat} />
            <Text style={styles.breakEvenLabel}>BAŞABAŞ FİYATI</Text>
          </View>
          <Text style={styles.breakEvenValue}>
            {breakEvenPrice !== null ? `${formatTL(breakEvenPrice, 2)} / kg` : 'Hesaplanamadı'}
          </Text>
          <Text style={styles.breakEvenHint}>
            {breakEvenPrice !== null
              ? 'Zarar etmemek için en düşük satış fiyatı.'
              : 'Başabaş fiyatı için tarlanın dönümü ve verim tahmini gerekli.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: spacing.md },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { color: colors.textOnDarkMuted, fontSize: font.xs, fontWeight: weight.heavy, letterSpacing: 1.2 },
  marginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  marginPillProfit: { backgroundColor: 'rgba(123,216,143,0.16)' },
  marginPillLoss: { backgroundColor: 'rgba(255,138,128,0.16)' },
  marginText: { marginLeft: 4, fontSize: font.xs, fontWeight: weight.bold },
  heroValue: {
    color: colors.white,
    fontSize: font.display,
    fontWeight: weight.heavy,
    marginTop: spacing.sm,
    letterSpacing: -0.5,
  },
  heroValueLoss: { color: '#FFB4AB' },
  heroSub: { color: colors.textOnDarkMuted, fontSize: font.sm, marginTop: spacing.xs },

  lossCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  lossTextBlock: { flex: 1, marginLeft: spacing.md },
  lossTitle: { fontSize: font.md, fontWeight: weight.heavy, color: colors.danger },
  lossBody: { fontSize: font.sm, color: colors.text, marginTop: spacing.xs, lineHeight: 20 },

  grid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tile: { ...card, flex: 1, padding: spacing.md },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tileLabel: { fontSize: font.xs, color: colors.textMuted, fontWeight: weight.medium },
  tileValue: { fontSize: font.lg, fontWeight: weight.heavy, color: colors.text, marginTop: 2 },

  flip: { marginBottom: spacing.md },
  breakEvenCard: {
    backgroundColor: colors.earthDark,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  breakEvenBack: { flex: 1, justifyContent: 'center', backgroundColor: '#3B2A1F' },
  breakEvenLabelBack: {
    fontSize: font.xs,
    fontWeight: weight.heavy,
    color: colors.wheat,
    letterSpacing: 1.2,
  },
  formula: { fontSize: font.md, color: colors.earthLight, marginTop: spacing.sm },
  formulaNumbers: { fontSize: font.lg, fontWeight: weight.bold, color: colors.white, marginTop: spacing.xs },
  formulaResult: { fontSize: font.xl, fontWeight: weight.heavy, color: colors.wheat, marginTop: spacing.xs },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  flipHintText: { marginLeft: 4, fontSize: font.xs, color: colors.earthLight, fontWeight: weight.bold },
  breakEvenHeader: { flexDirection: 'row', alignItems: 'center' },
  breakEvenLabel: {
    marginLeft: spacing.sm,
    fontSize: font.xs,
    fontWeight: weight.heavy,
    color: colors.wheat,
    letterSpacing: 1.2,
  },
  breakEvenValue: { fontSize: font.xxl, fontWeight: weight.heavy, color: colors.white, marginTop: spacing.xs },
  meterBlock: { marginTop: spacing.md },
  meterMark: { position: 'absolute', left: '50%', top: -3, width: 2, height: 16, backgroundColor: colors.white },
  breakEvenHint: { fontSize: font.sm, color: colors.earthLight, marginTop: spacing.sm, lineHeight: 20 },
});

export default React.memo(ProfitSummary);
