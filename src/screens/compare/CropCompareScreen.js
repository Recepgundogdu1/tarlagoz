// "Ne ekelim?": aynı dönüm için ürünleri tahmini maliyet, gelir ve net kâra
// göre karşılaştırır. Fiyatlar kullanıcı tarafından değiştirilebilir;
// "Hesapla" denince liste yeni fiyatlarla yeniden sıralanır.

import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import FadeInView from '../../components/motion/FadeInView';
import AnimatedBar from '../../components/motion/AnimatedBar';
import { compareCrops } from '../../utils/calculations';
import { formatKg, formatTL, parseNumber } from '../../utils/format';
import { CROPS } from '../../constants/crops';
import { card, colors, font, radius, spacing } from '../../constants/theme';

// Başlangıçta her ürünün varsayılan fiyatı giriş kutusunda görünür.
function defaultPriceTexts() {
  const texts = {};
  CROPS.forEach((crop) => {
    texts[crop.key] = String(crop.pricePerKg).replace('.', ',');
  });
  return texts;
}

// Tek ürün satırı. React.memo sayesinde yalnızca kendi verisi değişen satır yeniden çizilir.
const CropRow = React.memo(function CropRow({ item, rank, barPercent, priceText, onChangePrice }) {
  const loss = item.netProfit < 0;
  const best = rank === 1 && !loss;
  return (
    <FadeInView index={rank - 1} style={[styles.row, best && styles.rowBest]}>
      <View style={styles.rowHeader}>
        <Text style={styles.rank}>{rank}.</Text>
        <Text style={styles.cropName} numberOfLines={1}>
          {item.label}
        </Text>
        {best ? (
          <View style={styles.bestBadge}>
            <Ionicons name="trophy-outline" size={14} color={colors.primaryDark} />
            <Text style={styles.bestBadgeText}>En kârlı</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Maliyet</Text>
          <Text style={styles.statValue}>{formatTL(item.totalExpense)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Gelir</Text>
          <Text style={styles.statValue}>{formatTL(item.estimatedRevenue)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{loss ? 'Net zarar' : 'Net kâr'}</Text>
          <Text style={[styles.statValue, loss ? styles.loss : styles.profit]}>
            {formatTL(item.netProfit)}
          </Text>
        </View>
      </View>

      {/* En kârlı ürüne göre bu ürünün kârı (zarardaysa boş kalır) */}
      <AnimatedBar
        percent={barPercent}
        color={best ? colors.primary : colors.earth}
        delay={150 + Math.min(rank, 8) * 60}
        style={styles.profitBar}
      />

      <View style={styles.bottomRow}>
        <Text style={styles.detail}>
          Hasat {formatKg(item.estimatedHarvest)} · Başabaş{' '}
          {item.breakEvenPrice !== null ? formatTL(item.breakEvenPrice, 2) : '-'}/kg
        </Text>
        <View style={styles.priceBox}>
          <TextInput
            style={styles.priceInput}
            value={priceText}
            onChangeText={(text) => onChangePrice(item.key, text)}
            keyboardType="decimal-pad"
            accessibilityLabel={`${item.label} satış fiyatı`}
            selectTextOnFocus
          />
          <Text style={styles.priceSuffix}>TL/kg</Text>
        </View>
      </View>
    </FadeInView>
  );
});

export default function CropCompareScreen() {
  const [areaText, setAreaText] = useState('10');
  const [priceTexts, setPriceTexts] = useState(defaultPriceTexts);
  // "Hesapla" denince uygulanan değerler. Yazarken liste zıplamasın diye
  // sıralama yalnızca bu değerlere göre yapılır.
  const [applied, setApplied] = useState({ area: 10, prices: {} });
  const [areaError, setAreaError] = useState(null);

  const handleChangePrice = useCallback((key, text) => {
    setPriceTexts((previous) => ({ ...previous, [key]: text }));
  }, []);

  const handleCalculate = useCallback(() => {
    const area = parseNumber(areaText);
    if (!Number.isFinite(area) || area <= 0) {
      setAreaError('Dönüm sıfırdan büyük bir sayı olmalı.');
      return;
    }
    setAreaError(null);
    const prices = {};
    Object.keys(priceTexts).forEach((key) => {
      const value = parseNumber(priceTexts[key]);
      if (Number.isFinite(value) && value > 0) prices[key] = value;
    });
    setApplied({ area, prices });
  }, [areaText, priceTexts]);

  const handleReset = useCallback(() => {
    setPriceTexts(defaultPriceTexts());
    setApplied((previous) => ({ area: previous.area, prices: {} }));
  }, []);

  // Karşılaştırma tablosu yalnızca uygulanan değerler değişince yeniden hesaplanır.
  const results = useMemo(
    () => compareCrops(applied.area, applied.prices),
    [applied]
  );

  // Çubukların ölçeği: listedeki en yüksek kâr %100 kabul edilir.
  const maxProfit = results.length > 0 ? Math.max(0, results[0].netProfit) : 0;

  const renderItem = useCallback(
    ({ item, index }) => (
      <CropRow
        item={item}
        rank={index + 1}
        barPercent={maxProfit > 0 ? (Math.max(0, item.netProfit) / maxProfit) * 100 : 0}
        priceText={priceTexts[item.key] || ''}
        onChangePrice={handleChangePrice}
      />
    ),
    [priceTexts, handleChangePrice, maxProfit]
  );

  const keyExtractor = useCallback((item) => item.key, []);

  const header = (
    <View>
      <Text style={styles.help}>
        Dönümü yazın, isterseniz ürünlerin satış fiyatını kendi beklentinize göre değiştirin ve
        "Hesapla"ya basın.
      </Text>
      <FormInput
        label="Ekilecek alan"
        value={areaText}
        onChangeText={setAreaText}
        error={areaError}
        keyboardType="decimal-pad"
        suffix="dönüm"
      />
      <View style={styles.buttonRow}>
        <PrimaryButton
          title="Hesapla"
          icon="calculator-outline"
          onPress={handleCalculate}
          style={styles.flexButton}
        />
        <PrimaryButton
          title="Sıfırla"
          variant="outline"
          onPress={handleReset}
          style={[styles.flexButton, styles.flexButtonLast]}
        />
      </View>
      <View style={styles.warning}>
        <Ionicons name="information-circle-outline" size={22} color={colors.info} />
        <Text style={styles.warningText}>
          Verim ve maliyetler ortalama tahminlerdir; bölgeye, yıla ve sulamaya göre değişir. Sonuçlar
          karar desteğidir, garanti değildir.
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        style={styles.flex}
        contentContainerStyle={styles.content}
        data={results}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        removeClippedSubviews={false}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  help: { fontSize: font.md, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 22 },
  buttonRow: { flexDirection: 'row', marginBottom: spacing.lg },
  flexButton: { flex: 1 },
  flexButtonLast: { marginLeft: spacing.md },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.infoLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  warningText: { flex: 1, marginLeft: spacing.sm, fontSize: font.sm, color: colors.text, lineHeight: 20 },
  row: { ...card, marginBottom: spacing.md },
  rowBest: { borderColor: colors.primary, borderWidth: 2 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  rank: { fontSize: font.lg, fontWeight: '800', color: colors.earth, width: 32 },
  cropName: { flex: 1, fontSize: font.lg, fontWeight: '700', color: colors.text },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  bestBadgeText: { marginLeft: 4, fontSize: font.xs, fontWeight: '700', color: colors.primaryDark },
  statsRow: { flexDirection: 'row', marginBottom: spacing.sm },
  profitBar: { marginBottom: spacing.md },
  stat: { flex: 1 },
  statLabel: { fontSize: font.xs, color: colors.textMuted },
  statValue: { fontSize: font.md, fontWeight: '700', color: colors.text, marginTop: 2 },
  profit: { color: colors.primary },
  loss: { color: colors.danger },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detail: { flex: 1, fontSize: font.sm, color: colors.textMuted, marginRight: spacing.sm },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
    backgroundColor: colors.surface,
  },
  priceInput: {
    minWidth: 56,
    fontSize: font.md,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    paddingVertical: 4,
  },
  priceSuffix: { marginLeft: 4, fontSize: font.sm, color: colors.textMuted },
});
