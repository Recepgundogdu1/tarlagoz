// Tarla detayı ve KÂR PANOSU.
// Toplam masraf, dönüm başı maliyet, tahmini hasat/gelir, net kâr, başabaş
// fiyatı, kategori dağılımı, hava tahmini, masraf listesi ve Tarla Karnesi.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import ProfitSummary from '../../components/ProfitSummary';
import WeatherBadge from '../../components/WeatherBadge';
import ExpenseItem from '../../components/ExpenseItem';
import FieldReportCard from '../../components/FieldReportCard';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import FadeInView from '../../components/motion/FadeInView';
import AnimatedBar from '../../components/motion/AnimatedBar';
import { CHART_COLORS, DonutChart } from '../../components/motion/RingChart';
import { deleteField, updateField } from '../../store/fieldsSlice';
import { deleteExpense } from '../../store/expensesSlice';
import { fetchWeatherForField } from '../../store/weatherSlice';
import {
  buildReportCard,
  categoryBreakdown,
  expensesForFieldSeason,
  fieldPrice,
  fieldProfit,
  fieldYield,
} from '../../utils/calculations';
import { formatDonum, formatNumber, formatPercent, formatTL, parseNumber } from '../../utils/format';
import { validateEstimates } from '../../utils/validators';
import { getCrop } from '../../constants/crops';
import { card, colors, font, spacing } from '../../constants/theme';

export default function FieldDetailScreen({ route, navigation }) {
  const fieldId = route.params ? route.params.fieldId : null;
  const dispatch = useDispatch();

  const field = useSelector((state) => state.fields.items.find((f) => f.id === fieldId));
  const allExpenses = useSelector((state) => state.expenses.items);
  const weather = useSelector((state) => state.weather.byField[fieldId]);
  const saving = useSelector((state) => state.fields.saving);

  const [editing, setEditing] = useState(false);
  const [yieldText, setYieldText] = useState('');
  const [priceText, setPriceText] = useState('');
  const [estimateErrors, setEstimateErrors] = useState({});

  // Bu tarlanın içinde bulunduğu sezona ait masraflar.
  const seasonExpenses = useMemo(
    () => (field ? expensesForFieldSeason(allExpenses, field.id, field.season) : []),
    [allExpenses, field]
  );

  // Kâr hesabı pahalı değil ama her çizimde tekrarlanmasın diye useMemo ile saklanıyor.
  const summary = useMemo(() => fieldProfit(field, allExpenses), [field, allExpenses]);
  const breakdown = useMemo(() => categoryBreakdown(seasonExpenses), [seasonExpenses]);
  // Halka grafiğin dilimleri: her masraf kalemi sırayla bir renk alır.
  const chartSegments = useMemo(
    () =>
      breakdown.map((item, index) => ({
        key: item.key,
        value: item.total,
        color: CHART_COLORS[index % CHART_COLORS.length],
      })),
    [breakdown]
  );
  const reportRows = useMemo(() => buildReportCard(field, allExpenses), [field, allExpenses]);

  const fieldName = field ? field.name : null;
  useEffect(() => {
    if (fieldName) navigation.setOptions({ title: fieldName });
  }, [navigation, fieldName]);

  useEffect(() => {
    if (field && field.location) dispatch(fetchWeatherForField(field));
  }, [dispatch, field]);

  const startEditing = useCallback(() => {
    if (!field) return;
    setYieldText(formatNumber(fieldYield(field), 0).replace(/\./g, ''));
    setPriceText(String(fieldPrice(field)).replace('.', ','));
    setEstimateErrors({});
    setEditing(true);
  }, [field]);

  const saveEstimates = useCallback(async () => {
    const check = validateEstimates({ expectedYield: yieldText, expectedPrice: priceText });
    setEstimateErrors(check.errors);
    if (!check.valid) return;
    try {
      await dispatch(
        updateField({
          id: fieldId,
          patch: {
            expectedYield: parseNumber(yieldText),
            expectedPrice: parseNumber(priceText),
          },
        })
      ).unwrap();
      setEditing(false);
    } catch (message) {
      Alert.alert('Kaydedilemedi', String(message));
    }
  }, [dispatch, fieldId, yieldText, priceText]);

  const handleDeleteExpense = useCallback(
    (expense) => {
      Alert.alert('Masraf silinsin mi?', `${formatTL(expense.amount)} tutarındaki masraf silinecek.`, [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteExpense(expense)).unwrap();
            } catch (message) {
              Alert.alert('Silinemedi', String(message));
            }
          },
        },
      ]);
    },
    [dispatch]
  );

  const handleDeleteField = useCallback(() => {
    Alert.alert(
      'Tarla silinsin mi?',
      'Bu tarla, tüm masrafları ve teşhis kayıtlarıyla birlikte silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteField(fieldId)).unwrap();
              navigation.goBack();
            } catch (message) {
              Alert.alert('Silinemedi', String(message));
            }
          },
        },
      ]
    );
  }, [dispatch, fieldId, navigation]);

  const renderExpense = useCallback(
    ({ item }) => <ExpenseItem expense={item} onDelete={handleDeleteExpense} />,
    [handleDeleteExpense]
  );
  const keyExtractor = useCallback((item) => item.id, []);

  if (!field) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="alert-circle-outline"
          title="Tarla bulunamadı"
          description="Bu tarla silinmiş olabilir."
          actionTitle="Tarlalarıma Dön"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const crop = getCrop(field.crop);

  // Liste başlığı JSX değeri olarak veriliyor (fonksiyon olarak değil); böylece
  // içindeki giriş kutuları her çizimde sıfırlanmaz.
  const header = (
    <View>
      <View style={styles.infoCard}>
        <Text style={styles.fieldName}>{field.name}</Text>
        <Text style={styles.fieldSub}>
          {crop.label} · {formatDonum(field.area)} · Sezon {field.season}
        </Text>
      </View>

      <ProfitSummary summary={summary} />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Tahminler</Text>
          {!editing ? (
            <Text style={styles.editLink} onPress={startEditing} accessibilityRole="button">
              Düzenle
            </Text>
          ) : null}
        </View>
        {editing ? (
          <View>
            <FormInput
              label="Beklenen verim"
              value={yieldText}
              onChangeText={setYieldText}
              error={estimateErrors.expectedYield}
              keyboardType="decimal-pad"
              suffix="kg / dönüm"
            />
            <FormInput
              label="Beklenen satış fiyatı"
              value={priceText}
              onChangeText={setPriceText}
              error={estimateErrors.expectedPrice}
              keyboardType="decimal-pad"
              suffix="TL / kg"
            />
            <View style={styles.buttonRow}>
              <PrimaryButton
                title="Vazgeç"
                variant="outline"
                onPress={() => setEditing(false)}
                style={styles.rowButton}
              />
              <PrimaryButton
                title="Kaydet"
                onPress={saveEstimates}
                loading={saving}
                style={[styles.rowButton, styles.rowButtonLast]}
              />
            </View>
          </View>
        ) : (
          <Text style={styles.estimateText}>
            Verim: {formatNumber(summary.yieldPerDonum, 0)} kg/dönüm · Fiyat:{' '}
            {formatTL(summary.pricePerKg, 2)}/kg
          </Text>
        )}
      </View>

      <PrimaryButton
        title="Masraf Ekle"
        icon="add-circle-outline"
        onPress={() => navigation.navigate('AddExpense', { fieldId: field.id })}
        style={styles.mainButton}
      />

      {breakdown.length > 0 ? (
        <FadeInView delay={200} style={styles.card}>
          <Text style={styles.cardTitle}>Masraf Dağılımı</Text>
          <View style={styles.chartWrap}>
            <DonutChart segments={chartSegments} size={184} thickness={24}>
              <Text style={styles.chartLabel}>Toplam</Text>
              <Text style={styles.chartValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatTL(summary.totalExpense)}
              </Text>
            </DonutChart>
          </View>
          {breakdown.map((item, index) => {
            const color = CHART_COLORS[index % CHART_COLORS.length];
            return (
              <View key={item.key} style={styles.breakdownRow}>
                <View style={styles.breakdownTop}>
                  <View style={styles.breakdownLabelRow}>
                    <View style={[styles.legendDot, { backgroundColor: color }]} />
                    <Ionicons name={item.icon} size={18} color={colors.earthDark} />
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.breakdownValue}>
                    {formatTL(item.total)} · {formatPercent(item.ratio)}
                  </Text>
                </View>
                <AnimatedBar
                  percent={Math.max(2, Math.round(item.ratio * 100))}
                  color={color}
                  delay={250 + index * 90}
                  style={styles.bar}
                />
              </View>
            );
          })}
        </FadeInView>
      ) : null}

      <WeatherBadge weather={weather} />

      <Text style={styles.sectionTitle}>
        Masraflar ({seasonExpenses.length})
      </Text>
    </View>
  );

  const footer = (
    <View style={styles.footer}>
      <FieldReportCard rows={reportRows} />
      <PrimaryButton
        title="Hastalık Tespiti Yap"
        icon="camera-outline"
        variant="secondary"
        onPress={() =>
          navigation.navigate('DiagnosisTab', { screen: 'Diagnosis', params: { fieldId: field.id } })
        }
        style={styles.footerButton}
      />
      <PrimaryButton
        title="Sezonu Kapat (Hasat Gir)"
        icon="checkmark-done-outline"
        variant="outline"
        onPress={() => navigation.navigate('CloseSeason', { fieldId: field.id })}
        style={styles.footerButton}
      />
      <PrimaryButton
        title="Bu Tarlayı Satışa Çıkar"
        icon="pricetag-outline"
        variant="outline"
        onPress={() =>
          navigation.navigate('MarketTab', {
            screen: 'CreateListing',
            params: { fieldId: field.id },
            initial: false,
          })
        }
        style={styles.footerButton}
      />
      <PrimaryButton
        title="Tarlayı Sil"
        icon="trash-outline"
        variant="danger"
        onPress={handleDeleteField}
        loading={saving && !editing}
        style={styles.footerButton}
      />
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={seasonExpenses}
      renderItem={renderExpense}
      keyExtractor={keyExtractor}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          Bu sezon için henüz masraf girilmedi. İlk masrafı ekleyince başabaş fiyatı hesaplanır.
        </Text>
      }
      keyboardShouldPersistTaps="handled"
      initialNumToRender={10}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  infoCard: { marginBottom: spacing.md },
  fieldName: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  fieldSub: { fontSize: font.md, color: colors.textMuted, marginTop: 2 },
  card: { ...card, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  editLink: { fontSize: font.md, fontWeight: '700', color: colors.primary, padding: spacing.xs },
  estimateText: { fontSize: font.md, color: colors.text },
  buttonRow: { flexDirection: 'row' },
  rowButton: { flex: 1 },
  rowButtonLast: { marginLeft: spacing.md },
  mainButton: { marginBottom: spacing.md },
  breakdownRow: { marginBottom: spacing.md },
  breakdownTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabelRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  breakdownLabel: { marginLeft: spacing.sm, fontSize: font.md, color: colors.text, fontWeight: '600' },
  breakdownValue: { fontSize: font.sm, color: colors.textMuted, fontWeight: '600' },
  bar: { marginTop: spacing.xs },
  chartWrap: { alignItems: 'center', marginVertical: spacing.md },
  chartLabel: { fontSize: font.sm, color: colors.textMuted, fontWeight: '600' },
  chartValue: { fontSize: font.lg, fontWeight: '800', color: colors.text, maxWidth: 120 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  sectionTitle: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: font.md,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  footer: { marginTop: spacing.lg },
  footerButton: { marginBottom: spacing.md },
});
