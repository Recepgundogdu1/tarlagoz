// Tarla Pazarı: satılık tarla ilanları. İl, en yüksek fiyat ve en az dönüme
// göre filtrelenebilir.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import ListingCard from '../../components/ListingCard';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import ErrorView from '../../components/ErrorView';
import { ListingListSkeleton } from '../../components/motion/Skeleton';
import SelectModal, { SelectField } from '../../components/SelectModal';
import {
  clearFilters,
  fetchListings,
  selectFilteredListings,
  setFilters,
} from '../../store/listingsSlice';
import { CITY_OPTIONS } from '../../constants/cities';
import { colors, font, spacing } from '../../constants/theme';

const ALL_CITIES_OPTIONS = [{ key: '', label: 'Tüm iller' }, ...CITY_OPTIONS];

export default function ListingListScreen({ navigation }) {
  const dispatch = useDispatch();
  const listings = useSelector(selectFilteredListings);
  const totalCount = useSelector((state) => state.listings.items.length);
  const status = useSelector((state) => state.listings.status);
  const error = useSelector((state) => state.listings.error);
  const filters = useSelector((state) => state.listings.filters);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => dispatch(fetchListings()), [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const handleSelectCity = useCallback(
    (city) => {
      dispatch(setFilters({ city }));
      setCityModalVisible(false);
    },
    [dispatch]
  );

  const handleOpen = useCallback(
    (listing) => navigation.navigate('ListingDetail', { listingId: listing.id }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item, index }) => <ListingCard listing={item} index={index} onPress={handleOpen} />,
    [handleOpen]
  );
  const keyExtractor = useCallback((item) => item.id, []);

  const hasActiveFilter = useMemo(
    () => Boolean(filters.city || filters.maxPrice || filters.minArea),
    [filters]
  );

  // Başlık JSX değeri olarak veriliyor; filtre kutularına yazarken odak kaybolmaz.
  const header = (
    <View>
      <PrimaryButton
        title="İlan Ver"
        icon="add-circle-outline"
        onPress={() => navigation.navigate('CreateListing')}
        style={styles.createButton}
      />

      <SelectField
        label="İl"
        valueLabel={filters.city || 'Tüm iller'}
        onPress={() => setCityModalVisible(true)}
      />
      <View style={styles.filterRow}>
        <FormInput
          label="En yüksek fiyat"
          value={filters.maxPrice}
          onChangeText={(text) => dispatch(setFilters({ maxPrice: text }))}
          placeholder="Örn. 5000000"
          keyboardType="decimal-pad"
          suffix="TL"
          style={styles.filterInput}
        />
        <FormInput
          label="En az alan"
          value={filters.minArea}
          onChangeText={(text) => dispatch(setFilters({ minArea: text }))}
          placeholder="Örn. 20"
          keyboardType="decimal-pad"
          suffix="dönüm"
          style={[styles.filterInput, styles.filterInputLast]}
        />
      </View>
      {hasActiveFilter ? (
        <PrimaryButton
          title="Filtreleri Temizle"
          variant="outline"
          onPress={() => dispatch(clearFilters())}
          style={styles.clearButton}
        />
      ) : null}

      <Text style={styles.count}>
        {listings.length} ilan gösteriliyor
        {hasActiveFilter ? ` (toplam ${totalCount})` : ''}
      </Text>

      {status === 'failed' && totalCount > 0 ? (
        <ErrorView message={error} onRetry={load} style={styles.inlineError} />
      ) : null}
    </View>
  );

  if (status === 'loading' && totalCount === 0) {
    return <ListingListSkeleton />;
  }

  if (status === 'failed' && totalCount === 0) {
    return (
      <View style={styles.container}>
        <ErrorView message={error} onRetry={load} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.content}
        data={listings}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon="pricetags-outline"
            title={hasActiveFilter ? 'Filtreye uyan ilan yok' : 'Henüz ilan yok'}
            description={
              hasActiveFilter
                ? 'Filtreleri değiştirerek tekrar deneyin.'
                : 'İlk ilanı siz verin. İlanınıza tarlanızın karnesi eklenir.'
            }
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
        keyboardShouldPersistTaps="handled"
        initialNumToRender={5}
      />

      <SelectModal
        visible={cityModalVisible}
        title="İl Seçin"
        options={ALL_CITIES_OPTIONS}
        selectedKey={filters.city}
        onSelect={handleSelectCity}
        onClose={() => setCityModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  createButton: { marginBottom: spacing.lg },
  filterRow: { flexDirection: 'row' },
  filterInput: { flex: 1 },
  filterInputLast: { marginLeft: spacing.md },
  clearButton: { marginBottom: spacing.lg, minHeight: 44 },
  count: { fontSize: font.sm, color: colors.textMuted, marginBottom: spacing.md },
  inlineError: { marginHorizontal: 0 },
});
