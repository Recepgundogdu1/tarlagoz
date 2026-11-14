// Sezonu kapatma: gerçek hasat ve satış fiyatı girilir, sezonun kesin kâr-zararı
// tarlanın geçmişine yazılır ve tarla yeni sezona hazırlanır.
// Tarla Karnesi'ndeki "Gerçekleşen" satırlar bu ekrandan oluşur.

import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import SelectModal, { SelectField } from '../../components/SelectModal';
import { closeSeason } from '../../store/fieldsSlice';
import { buildSeasonSummary } from '../../utils/calculations';
import { formatKg, formatTL, parseNumber } from '../../utils/format';
import { validateCloseSeason } from '../../utils/validators';
import { CROPS, getCrop } from '../../constants/crops';
import { card, colors, font, spacing } from '../../constants/theme';
import { hapticSuccess } from '../../utils/motion';

const CROP_OPTIONS = CROPS.map((c) => ({ key: c.key, label: c.label }));

// "2026" -> "2027". Sezon adı yıl değilse boş bırakılır, kullanıcı yazar.
function suggestNextSeason(season) {
  const year = Number(season);
  return Number.isInteger(year) && year > 1900 ? String(year + 1) : '';
}

export default function CloseSeasonScreen({ route, navigation }) {
  const fieldId = route.params ? route.params.fieldId : null;
  const dispatch = useDispatch();
  const field = useSelector((state) => state.fields.items.find((f) => f.id === fieldId));
  const allExpenses = useSelector((state) => state.expenses.items);
  const saving = useSelector((state) => state.fields.saving);

  const [harvestKg, setHarvestKg] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [nextSeason, setNextSeason] = useState(field ? suggestNextSeason(field.season) : '');
  const [nextCrop, setNextCrop] = useState(field ? field.crop : '');
  const [errors, setErrors] = useState({});
  const [cropModalVisible, setCropModalVisible] = useState(false);

  // Girilen değerlerle sezonun kesin sonucu (canlı önizleme).
  const preview = useMemo(() => {
    if (!field) return null;
    const harvest = parseNumber(harvestKg);
    const price = parseNumber(salePrice);
    if (!Number.isFinite(harvest) || !Number.isFinite(price)) return null;
    return buildSeasonSummary(field, allExpenses, { harvestKg: harvest, salePrice: price });
  }, [field, allExpenses, harvestKg, salePrice]);

  const handleSelectCrop = useCallback((key) => {
    setNextCrop(key);
    setCropModalVisible(false);
  }, []);

  const submit = useCallback(async () => {
    try {
      await dispatch(
        closeSeason({
          fieldId,
          harvestKg: parseNumber(harvestKg),
          salePrice: parseNumber(salePrice),
          nextSeason: nextSeason.trim(),
          nextCrop,
        })
      ).unwrap();
      hapticSuccess();
      Alert.alert('Sezon kapatıldı', 'Sezon sonucu Tarla Karnesi\'ne eklendi.');
      navigation.goBack();
    } catch (message) {
      Alert.alert('Sezon kapatılamadı', String(message));
    }
  }, [dispatch, navigation, fieldId, harvestKg, salePrice, nextSeason, nextCrop]);

  const handleSave = useCallback(() => {
    const check = validateCloseSeason({ harvestKg, salePrice, nextSeason, nextCrop });
    const nextErrors = { ...check.errors };
    if (field && nextSeason.trim() === String(field.season)) {
      nextErrors.nextSeason = 'Yeni sezon, kapatılan sezondan farklı olmalı.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    Alert.alert(
      'Sezon kapatılsın mı?',
      `${field.season} sezonu kapatılacak ve sonuç karneye yazılacak. Bu işlem geri alınamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Kapat', onPress: submit },
      ]
    );
  }, [field, harvestKg, salePrice, nextSeason, nextCrop, submit]);

  if (!field) {
    return (
      <View style={styles.flex}>
        <EmptyState
          icon="alert-circle-outline"
          title="Tarla bulunamadı"
          actionTitle="Geri Dön"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          {field.name} · {getCrop(field.crop).label} · Sezon {field.season}
        </Text>
        <Text style={styles.help}>
          Hasat bittiğinde gerçek rakamları girin. Bu sezonun kesin kâr-zararı hesaplanır ve
          tarlanın karnesine eklenir.
        </Text>

        <FormInput
          label="Toplam hasat"
          value={harvestKg}
          onChangeText={setHarvestKg}
          error={errors.harvestKg}
          placeholder="Örnek: 50000"
          keyboardType="decimal-pad"
          suffix="kg"
        />
        <FormInput
          label="Ortalama satış fiyatı"
          value={salePrice}
          onChangeText={setSalePrice}
          error={errors.salePrice}
          placeholder="Örnek: 30"
          keyboardType="decimal-pad"
          suffix="TL / kg"
        />

        {preview ? (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Sezon sonucu</Text>
            <Text style={styles.previewLine}>Hasat: {formatKg(preview.harvestKg)}</Text>
            <Text style={styles.previewLine}>Gelir: {formatTL(preview.revenue)}</Text>
            <Text style={styles.previewLine}>Toplam masraf: {formatTL(preview.totalExpense)}</Text>
            <Text
              style={[styles.previewResult, preview.netProfit < 0 ? styles.loss : styles.profit]}
            >
              {preview.netProfit < 0 ? 'Net zarar' : 'Net kâr'}: {formatTL(preview.netProfit)}
            </Text>
            <Text style={styles.previewLine}>
              Dönüm başı kazanç: {formatTL(preview.profitPerDonum)}
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Yeni sezon</Text>
        <FormInput
          label="Yeni sezon adı"
          value={nextSeason}
          onChangeText={setNextSeason}
          error={errors.nextSeason}
          placeholder="Örnek: 2027"
          maxLength={20}
        />
        <SelectField
          label="Yeni sezonun ürünü"
          valueLabel={nextCrop ? getCrop(nextCrop).label : ''}
          placeholder="Ürün seçin"
          onPress={() => setCropModalVisible(true)}
          error={errors.nextCrop}
        />

        <PrimaryButton
          title="Sezonu Kapat"
          icon="checkmark-done-outline"
          onPress={handleSave}
          loading={saving}
        />
      </ScrollView>

      <SelectModal
        visible={cropModalVisible}
        title="Ürün Seçin"
        options={CROP_OPTIONS}
        selectedKey={nextCrop}
        onSelect={handleSelectCrop}
        onClose={() => setCropModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  help: { fontSize: font.md, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl, lineHeight: 22 },
  preview: { ...card, marginBottom: spacing.xl },
  previewTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  previewLine: { fontSize: font.md, color: colors.text, marginBottom: 4 },
  previewResult: { fontSize: font.xl, fontWeight: '800', marginVertical: spacing.xs },
  profit: { color: colors.primary },
  loss: { color: colors.danger },
  sectionTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
});
