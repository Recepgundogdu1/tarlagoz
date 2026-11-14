// İlan oluşturma: satılacak tarla seçilir, fiyat, il/ilçe, açıklama ve
// fotoğraflar eklenir. Tarlanın karnesi ilanla birlikte yayınlanır.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import FormInput from '../../components/FormInput';
import ChipSelect from '../../components/ChipSelect';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import FieldReportCard from '../../components/FieldReportCard';
import Loading from '../../components/Loading';
import SelectModal, { SelectField } from '../../components/SelectModal';
import { fetchFields } from '../../store/fieldsSlice';
import { fetchExpenses } from '../../store/expensesSlice';
import { createListing } from '../../store/listingsSlice';
import { MAX_LISTING_PHOTOS } from '../../services/listingService';
import { buildReportCard } from '../../utils/calculations';
import { formatDonum, parseNumber } from '../../utils/format';
import { validateListing } from '../../utils/validators';
import { pickImage } from '../../utils/device';
import { getErrorMessage } from '../../utils/errors';
import { getCrop } from '../../constants/crops';
import { CITY_OPTIONS } from '../../constants/cities';
import { colors, font, radius, spacing } from '../../constants/theme';
import { hapticSuccess } from '../../utils/motion';

export default function CreateListingScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const fields = useSelector((state) => state.fields.items);
  const fieldsStatus = useSelector((state) => state.fields.status);
  const expenses = useSelector((state) => state.expenses.items);
  const expensesStatus = useSelector((state) => state.expenses.status);
  const saving = useSelector((state) => state.listings.saving);

  const paramFieldId = route.params ? route.params.fieldId : null;
  const [fieldId, setFieldId] = useState(paramFieldId || '');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [photoUris, setPhotoUris] = useState([]);
  const [errors, setErrors] = useState({});
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Karne masraflardan hesaplandığı için ikisi de yüklenmiş olmalı.
  useEffect(() => {
    if (fieldsStatus === 'idle') dispatch(fetchFields());
    if (expensesStatus === 'idle') dispatch(fetchExpenses());
  }, [dispatch, fieldsStatus, expensesStatus]);

  useEffect(() => {
    if (paramFieldId) setFieldId(paramFieldId);
  }, [paramFieldId]);

  const field = useMemo(() => fields.find((f) => f.id === fieldId) || null, [fields, fieldId]);

  const fieldOptions = useMemo(
    () => fields.map((f) => ({ key: f.id, label: `${f.name} (${formatDonum(f.area)})` })),
    [fields]
  );

  // İlanla birlikte yayınlanacak karne (ilan anındaki kopya).
  const reportCard = useMemo(() => buildReportCard(field, expenses), [field, expenses]);

  // Tarla seçilince başlık boşsa hazır bir başlık öner.
  const handleSelectField = useCallback(
    (id) => {
      setFieldId(id);
      const selected = fields.find((f) => f.id === id);
      if (selected) {
        setTitle((current) =>
          current.trim()
            ? current
            : `${formatDonum(selected.area)} ${getCrop(selected.crop).label.toLocaleLowerCase('tr-TR')} tarlası`
        );
      }
    },
    [fields]
  );

  const handleSelectCity = useCallback((key) => {
    setCity(key);
    setCityModalVisible(false);
  }, []);

  const handleAddPhoto = useCallback(
    async (fromCamera) => {
      if (photoUris.length >= MAX_LISTING_PHOTOS) {
        Alert.alert('Fotoğraf sınırı', `En fazla ${MAX_LISTING_PHOTOS} fotoğraf ekleyebilirsiniz.`);
        return;
      }
      try {
        const photo = await pickImage({ fromCamera, quality: 0.5 });
        if (!photo) return;
        setPhotoUris((previous) => [...previous, photo.uri].slice(0, MAX_LISTING_PHOTOS));
      } catch (error) {
        Alert.alert('Fotoğraf eklenemedi', getErrorMessage(error, 'Fotoğraf eklenemedi.'));
      }
    },
    [photoUris.length]
  );

  const handleRemovePhoto = useCallback((uri) => {
    setPhotoUris((previous) => previous.filter((item) => item !== uri));
  }, []);

  const handleSubmit = useCallback(async () => {
    const check = validateListing({ fieldId, title, price, city, district, description, phone });
    setErrors(check.errors);
    if (!check.valid || !field) return;

    try {
      const created = await dispatch(
        createListing({
          data: {
            fieldId: field.id,
            title: title.trim(),
            price: Math.round(parseNumber(price)),
            area: field.area,
            city,
            district: district.trim(),
            description: description.trim(),
            phone: phone.trim(),
            location: field.location || null,
            reportCard,
          },
          photoUris,
        })
      ).unwrap();
      hapticSuccess();
      Alert.alert('İlan yayınlandı', 'İlanınız Tarla Pazarı\'nda görünüyor.');
      navigation.replace('ListingDetail', { listingId: created.id });
    } catch (message) {
      Alert.alert('İlan yayınlanamadı', String(message));
    }
  }, [
    dispatch,
    navigation,
    field,
    fieldId,
    title,
    price,
    city,
    district,
    description,
    phone,
    photoUris,
    reportCard,
  ]);

  if (fieldsStatus === 'loading' && fields.length === 0) {
    return <Loading fullScreen message="Tarlalarınız yükleniyor..." />;
  }

  if (fields.length === 0) {
    return (
      <View style={styles.flex}>
        <EmptyState
          icon="pricetags-outline"
          title="Önce bir tarla ekleyin"
          description="İlan vermek için satılacak tarlanın uygulamada kayıtlı olması gerekir; karne o kayıtlardan oluşur."
          actionTitle="Tarla Ekle"
          onAction={() => navigation.navigate('FieldsTab', { screen: 'AddField', initial: false })}
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
        <ChipSelect
          label="Satılacak tarla"
          options={fieldOptions}
          value={fieldId}
          onChange={handleSelectField}
          error={errors.fieldId}
        />

        <FormInput
          label="İlan başlığı"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
          placeholder="Örnek: 45 dönüm sulu pamuk tarlası"
          maxLength={120}
        />
        <FormInput
          label="Satış fiyatı"
          value={price}
          onChangeText={setPrice}
          error={errors.price}
          placeholder="Örnek: 4500000"
          keyboardType="decimal-pad"
          suffix="TL"
        />
        <SelectField
          label="İl"
          valueLabel={city}
          placeholder="İl seçin"
          onPress={() => setCityModalVisible(true)}
          error={errors.city}
        />
        <FormInput
          label="İlçe"
          value={district}
          onChangeText={setDistrict}
          error={errors.district}
          placeholder="Örnek: Harran"
          maxLength={40}
        />
        <FormInput
          label="İletişim telefonu"
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
          placeholder="05xx xxx xx xx"
          keyboardType="phone-pad"
          maxLength={17}
          hint="Bu numara ilanı gören herkese görünür."
        />
        <FormInput
          label="Açıklama (isteğe bağlı)"
          value={description}
          onChangeText={setDescription}
          error={errors.description}
          placeholder="Sulama durumu, yola yakınlık, tapu durumu..."
          maxLength={1000}
          multiline
        />

        <Text style={styles.label}>
          Fotoğraflar ({photoUris.length}/{MAX_LISTING_PHOTOS})
        </Text>
        <View style={styles.photoRow}>
          {photoUris.map((uri) => (
            <View key={uri} style={styles.photoBox}>
              <Image source={{ uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removePhoto}
                onPress={() => handleRemovePhoto(uri)}
                accessibilityRole="button"
                accessibilityLabel="Fotoğrafı kaldır"
              >
                <Ionicons name="close" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={styles.buttonRow}>
          <PrimaryButton
            title="Çek"
            icon="camera-outline"
            variant="outline"
            onPress={() => handleAddPhoto(true)}
            style={styles.flexButton}
          />
          <PrimaryButton
            title="Galeri"
            icon="images-outline"
            variant="outline"
            onPress={() => handleAddPhoto(false)}
            style={[styles.flexButton, styles.flexButtonLast]}
          />
        </View>

        {field ? (
          <View>
            <Text style={styles.label}>İlanla birlikte yayınlanacak karne</Text>
            <FieldReportCard rows={reportCard} />
            <Text style={styles.notice}>
              İlanı yayınladığınızda bu karne (sezon, ürün, masraf ve kâr özetleri) ilanı gören
              herkese görünür. Tek tek masraf kayıtlarınız paylaşılmaz.
            </Text>
          </View>
        ) : null}

        <PrimaryButton
          title="İlanı Yayınla"
          icon="megaphone-outline"
          onPress={handleSubmit}
          loading={saving}
        />
        {saving ? (
          <Text style={styles.savingHint}>Fotoğraflar yükleniyor; bu biraz sürebilir...</Text>
        ) : null}
      </ScrollView>

      <SelectModal
        visible={cityModalVisible}
        title="İl Seçin"
        options={CITY_OPTIONS}
        selectedKey={city}
        onSelect={handleSelectCity}
        onClose={() => setCityModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  label: { fontSize: font.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap' },
  photoBox: { marginRight: spacing.sm, marginBottom: spacing.sm },
  photo: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.earthLight },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: { flexDirection: 'row', marginBottom: spacing.xl },
  flexButton: { flex: 1 },
  flexButtonLast: { marginLeft: spacing.md },
  notice: {
    fontSize: font.sm,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  savingHint: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});
