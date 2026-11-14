// Tarla ekleme: ad, ürün, dönüm, sezon ve konum.
// Dönüm elle yazılabilir veya haritada sınır çizilerek otomatik hesaplanır.

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import SelectModal, { SelectField } from '../../components/SelectModal';
import { addField, clearDraftPolygon } from '../../store/fieldsSlice';
import { validateField } from '../../utils/validators';
import { currentSeason, parseNumber } from '../../utils/format';
import { getCurrentLocation } from '../../utils/device';
import { getErrorMessage } from '../../utils/errors';
import { CROPS, getCrop } from '../../constants/crops';
import { colors, font, radius, spacing } from '../../constants/theme';
import { hapticSuccess } from '../../utils/motion';

const CROP_OPTIONS = CROPS.map((c) => ({ key: c.key, label: c.label }));

// Sayıyı giriş kutusunda Türkçe ondalık ayırıcıyla gösterir: 12.5 -> "12,5"
function toInputText(value) {
  return String(value).replace('.', ',');
}

export default function AddFieldScreen({ navigation }) {
  const dispatch = useDispatch();
  const saving = useSelector((state) => state.fields.saving);
  const draft = useSelector((state) => state.fields.draftPolygon);

  const [name, setName] = useState('');
  const [crop, setCrop] = useState('');
  const [area, setArea] = useState('');
  const [season, setSeason] = useState(currentSeason());
  const [expectedYield, setExpectedYield] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [location, setLocation] = useState(null);
  const [polygon, setPolygon] = useState([]);
  const [errors, setErrors] = useState({});
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [locating, setLocating] = useState(false);

  // Sınır çizme ekranından dönen çokgeni forma al.
  useEffect(() => {
    if (!draft) return;
    setPolygon(draft.polygon || []);
    if (draft.area > 0) setArea(toInputText(draft.area));
    if (draft.center) setLocation(draft.center);
    dispatch(clearDraftPolygon());
  }, [draft, dispatch]);

  const handleSelectCrop = useCallback((key) => {
    const selected = getCrop(key);
    setCrop(key);
    // Ürün seçilince verim ve fiyat varsayılanları doldurulur; kullanıcı değiştirebilir.
    setExpectedYield(toInputText(selected.yieldPerDonum));
    setExpectedPrice(toInputText(selected.pricePerKg));
    setCropModalVisible(false);
  }, []);

  const handleUseLocation = useCallback(async () => {
    setLocating(true);
    try {
      const current = await getCurrentLocation();
      setLocation(current);
    } catch (error) {
      Alert.alert('Konum alınamadı', getErrorMessage(error, 'Konum alınamadı. Tekrar deneyin.'));
    } finally {
      setLocating(false);
    }
  }, []);

  const handleDraw = useCallback(() => {
    navigation.navigate('DrawField', { center: location, polygon });
  }, [navigation, location, polygon]);

  const handleSave = useCallback(async () => {
    const check = validateField({ name, crop, area, season, expectedYield, expectedPrice });
    setErrors(check.errors);
    if (!check.valid) return;

    const selected = getCrop(crop);
    const yieldNumber = parseNumber(expectedYield);
    const priceNumber = parseNumber(expectedPrice);

    try {
      const created = await dispatch(
        addField({
          name: name.trim(),
          crop,
          area: Math.round(parseNumber(area) * 10) / 10,
          season: season.trim(),
          location,
          polygon,
          expectedYield: Number.isFinite(yieldNumber) ? yieldNumber : selected.yieldPerDonum,
          expectedPrice: Number.isFinite(priceNumber) ? priceNumber : selected.pricePerKg,
        })
      ).unwrap();
      hapticSuccess();
      // Formun yerine yeni tarlanın detayını aç.
      navigation.replace('FieldDetail', { fieldId: created.id });
    } catch (message) {
      Alert.alert('Tarla kaydedilemedi', String(message));
    }
  }, [dispatch, navigation, name, crop, area, season, expectedYield, expectedPrice, location, polygon]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormInput
          label="Tarla adı"
          value={name}
          onChangeText={setName}
          error={errors.name}
          placeholder="Örnek: Yukarı Tarla"
          maxLength={60}
        />

        <SelectField
          label="Ürün"
          valueLabel={crop ? getCrop(crop).label : ''}
          placeholder="Ürün seçin"
          onPress={() => setCropModalVisible(true)}
          error={errors.crop}
        />

        <View style={styles.mapBox}>
          <View style={styles.mapBoxText}>
            <Text style={styles.mapBoxTitle}>Tarla sınırı</Text>
            <Text style={styles.mapBoxHint}>
              {polygon.length >= 3
                ? `Sınır çizildi (${polygon.length} köşe). Dönüm otomatik hesaplandı.`
                : 'Haritada köşelere dokunarak sınırı çizin; dönüm kendiliğinden hesaplanır.'}
            </Text>
          </View>
          <PrimaryButton
            title={polygon.length >= 3 ? 'Sınırı Değiştir' : 'Haritada Çiz'}
            icon="map-outline"
            variant="secondary"
            onPress={handleDraw}
          />
        </View>

        <FormInput
          label="Alan"
          value={area}
          onChangeText={setArea}
          error={errors.area}
          placeholder="Örnek: 45"
          keyboardType="decimal-pad"
          suffix="dönüm"
          hint="1 dönüm = 1.000 m²"
        />

        <FormInput
          label="Sezon"
          value={season}
          onChangeText={setSeason}
          error={errors.season}
          placeholder="Örnek: 2026"
          maxLength={20}
        />

        <FormInput
          label="Beklenen verim"
          value={expectedYield}
          onChangeText={setExpectedYield}
          error={errors.expectedYield}
          keyboardType="decimal-pad"
          suffix="kg / dönüm"
          hint="Ürün seçince bölge ortalamasına yakın bir değer gelir; kendi tarlanıza göre düzeltin."
        />

        <FormInput
          label="Beklenen satış fiyatı"
          value={expectedPrice}
          onChangeText={setExpectedPrice}
          error={errors.expectedPrice}
          keyboardType="decimal-pad"
          suffix="TL / kg"
        />

        <View style={styles.locationBox}>
          <Ionicons
            name={location ? 'location' : 'location-outline'}
            size={24}
            color={location ? colors.primary : colors.textMuted}
          />
          <Text style={styles.locationText}>
            {location
              ? `Konum kaydedildi (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`
              : 'Konum eklenmedi. Hava tahmini ve don uyarısı için konum gerekli.'}
          </Text>
        </View>
        <PrimaryButton
          title="Şu Anki Konumumu Kullan"
          icon="navigate-outline"
          variant="outline"
          onPress={handleUseLocation}
          loading={locating}
          style={styles.locationButton}
        />

        <PrimaryButton
          title="Tarlayı Kaydet"
          icon="checkmark-circle-outline"
          onPress={handleSave}
          loading={saving}
        />
      </ScrollView>

      <SelectModal
        visible={cropModalVisible}
        title="Ürün Seçin"
        options={CROP_OPTIONS}
        selectedKey={crop}
        onSelect={handleSelectCrop}
        onClose={() => setCropModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  mapBox: {
    backgroundColor: colors.earthLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  mapBoxText: { marginBottom: spacing.md },
  mapBoxTitle: { fontSize: font.md, fontWeight: '700', color: colors.text },
  mapBoxHint: { fontSize: font.sm, color: colors.textMuted, marginTop: 2, lineHeight: 20 },
  locationBox: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  locationText: { flex: 1, marginLeft: spacing.sm, fontSize: font.sm, color: colors.text, lineHeight: 20 },
  locationButton: { marginBottom: spacing.xl },
});
