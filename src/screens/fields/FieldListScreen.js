// Tarlalarım: kullanıcının tüm tarlaları, her biri için masraf ve tahmini kâr.
// Üstte genel özet ve "Tarla Ekle" / "Ne Ekelim?" düğmeleri bulunur.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import FieldCard from '../../components/FieldCard';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import ErrorView from '../../components/ErrorView';
import GradientHero from '../../components/motion/GradientHero';
import AnimatedNumber from '../../components/motion/AnimatedNumber';
import FadeInView from '../../components/motion/FadeInView';
import { FieldListSkeleton } from '../../components/motion/Skeleton';
import { fetchFields } from '../../store/fieldsSlice';
import { fetchExpenses, selectPendingCount } from '../../store/expensesSlice';
import { fetchWeatherForField } from '../../store/weatherSlice';
import { fieldProfit } from '../../utils/calculations';
import { formatDonum, formatTL } from '../../utils/format';
import { colors, font, radius, sectionTitle, spacing } from '../../constants/theme';

export default function FieldListScreen({ navigation }) {
  const dispatch = useDispatch();
  const fields = useSelector((state) => state.fields.items);
  const status = useSelector((state) => state.fields.status);
  const error = useSelector((state) => state.fields.error);
  const fromCache = useSelector((state) => state.fields.fromCache);
  const expenses = useSelector((state) => state.expenses.items);
  const weatherByField = useSelector((state) => state.weather.byField);
  const pendingCount = useSelector(selectPendingCount);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([dispatch(fetchFields()), dispatch(fetchExpenses())]);
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  // Konumu olan her tarla için hava tahmini (don uyarısı da buradan tetiklenir).
  // Veri tazeyse thunk kendiliğinden istek atmaz.
  useEffect(() => {
    fields.forEach((field) => {
      if (field.location) dispatch(fetchWeatherForField(field));
    });
  }, [fields, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  // Her tarlanın kâr özeti. Tarlalar veya masraflar değişmedikçe yeniden hesaplanmaz.
  const summaries = useMemo(() => {
    const map = {};
    fields.forEach((field) => {
      map[field.id] = fieldProfit(field, expenses);
    });
    return map;
  }, [fields, expenses]);

  const totals = useMemo(() => {
    return fields.reduce(
      (acc, field) => {
        const summary = summaries[field.id];
        return {
          area: acc.area + (Number(field.area) || 0),
          expense: acc.expense + (summary ? summary.totalExpense : 0),
          profit: acc.profit + (summary ? summary.netProfit : 0),
        };
      },
      { area: 0, expense: 0, profit: 0 }
    );
  }, [fields, summaries]);

  const handleOpenField = useCallback(
    (field) => navigation.navigate('FieldDetail', { fieldId: field.id }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <FieldCard
        field={item}
        index={index}
        summary={summaries[item.id]}
        weather={weatherByField[item.id]}
        onPress={handleOpenField}
      />
    ),
    [summaries, weatherByField, handleOpenField]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  const header = (
    <View>
      {fromCache ? (
        <View style={styles.banner}>
          <Ionicons name="cloud-offline-outline" size={20} color={colors.warning} />
          <Text style={styles.bannerText}>
            İnternet yok. Telefondaki son kayıtlar gösteriliyor.
          </Text>
        </View>
      ) : null}
      {pendingCount > 0 ? (
        <View style={styles.banner}>
          <Ionicons name="time-outline" size={20} color={colors.warning} />
          <Text style={styles.bannerText}>
            {pendingCount} masraf telefonda bekliyor; internet gelince gönderilecek.
          </Text>
        </View>
      ) : null}

      {fields.length > 0 ? (
        <GradientHero style={styles.totalCard}>
          <Text style={styles.totalTitle}>GENEL DURUM</Text>
          <AnimatedNumber
            value={totals.profit}
            formatter={formatTL}
            duration={1200}
            style={[styles.totalBig, totals.profit < 0 && styles.totalLoss]}
            numberOfLines={1}
            adjustsFontSizeToFit
          />
          <Text style={styles.totalCaption}>Tahmini net {totals.profit < 0 ? 'zarar' : 'kâr'}</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalChip}>
              <Ionicons name="grid-outline" size={16} color={colors.wheat} />
              <Text style={styles.totalChipText}>{fields.length} tarla</Text>
            </View>
            <View style={styles.totalChip}>
              <Ionicons name="resize-outline" size={16} color={colors.wheat} />
              <Text style={styles.totalChipText}>{formatDonum(Math.round(totals.area * 10) / 10)}</Text>
            </View>
            <View style={styles.totalChip}>
              <Ionicons name="wallet-outline" size={16} color={colors.wheat} />
              <Text style={styles.totalChipText}>{formatTL(totals.expense)}</Text>
            </View>
          </View>
        </GradientHero>
      ) : null}

      <FadeInView delay={120} style={styles.actions}>
        <PrimaryButton
          title="Tarla Ekle"
          icon="add-circle-outline"
          onPress={() => navigation.navigate('AddField')}
          style={styles.actionButton}
        />
        <PrimaryButton
          title="Ne Ekelim?"
          icon="help-circle-outline"
          variant="secondary"
          onPress={() => navigation.navigate('CropCompare')}
          style={[styles.actionButton, styles.actionButtonLast]}
        />
      </FadeInView>
      {fields.length > 0 ? <Text style={styles.sectionTitle}>Tarlalarım</Text> : null}
    </View>
  );

  if (status === 'loading' && fields.length === 0) {
    // Dönen çark yerine, gelecek içeriğin şeklini gösteren iskelet görünüm.
    return <FieldListSkeleton />;
  }

  if (status === 'failed' && fields.length === 0) {
    return (
      <View style={styles.container}>
        <ErrorView message={error} onRetry={load} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={fields}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <EmptyState
          icon="leaf-outline"
          title="Henüz tarla eklemediniz"
          description="İlk tarlanızı ekleyin; masraflarınızı girdikçe kâr-zarar durumunu burada göreceksiniz."
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      initialNumToRender={6}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerText: { flex: 1, marginLeft: spacing.sm, fontSize: font.sm, color: colors.text },
  totalCard: { marginBottom: spacing.lg },
  totalTitle: { color: colors.textOnDarkMuted, fontSize: font.xs, fontWeight: '800', letterSpacing: 1.2 },
  totalBig: { color: colors.white, fontSize: font.display, fontWeight: '800', marginTop: spacing.sm },
  totalCaption: { color: colors.textOnDarkMuted, fontSize: font.sm, marginTop: 2 },
  totalRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.lg, gap: spacing.sm },
  totalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  totalChipText: { marginLeft: 6, color: colors.white, fontSize: font.sm, fontWeight: '700' },
  totalLoss: { color: '#FFB4AB' },
  sectionTitle: { ...sectionTitle, marginTop: spacing.xs },
  actions: { flexDirection: 'row', marginBottom: spacing.lg },
  actionButton: { flex: 1 },
  actionButtonLast: { marginLeft: spacing.md },
});
