// İlan detayı: fotoğraflar, fiyat, konum, açıklama, TARLA KARNESİ ve satıcıyla
// iletişim. İlan sahibi ilanını buradan kaldırabilir.

import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import FieldReportCard from '../../components/FieldReportCard';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import { deleteListing } from '../../store/listingsSlice';
import { formatDateTime, formatDonum, formatTL } from '../../utils/format';
import { card, colors, font, radius, spacing } from '../../constants/theme';

export default function ListingDetailScreen({ route, navigation }) {
  const listingId = route.params ? route.params.listingId : null;
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  const listing = useSelector((state) => state.listings.items.find((l) => l.id === listingId));
  const uid = useSelector((state) => (state.auth.user ? state.auth.user.uid : null));
  const [deleting, setDeleting] = useState(false);

  const handleCall = useCallback(async () => {
    if (!listing || !listing.phone) return;
    const url = `tel:${String(listing.phone).replace(/[^\d+]/g, '')}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Arama başlatılamadı', `Satıcının numarası: ${listing.phone}`);
    }
  }, [listing]);

  const handleDelete = useCallback(() => {
    Alert.alert('İlan kaldırılsın mı?', 'İlan ve fotoğrafları kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Kaldır',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await dispatch(deleteListing(listing)).unwrap();
            navigation.goBack();
          } catch (message) {
            setDeleting(false);
            Alert.alert('İlan kaldırılamadı', String(message));
          }
        },
      },
    ]);
  }, [dispatch, navigation, listing]);

  const photoWidth = width - spacing.lg * 2;

  const renderPhoto = useCallback(
    ({ item }) => (
      <Image
        source={{ uri: item }}
        style={[styles.photo, { width: photoWidth }]}
        resizeMode="cover"
      />
    ),
    [photoWidth]
  );
  const photoKey = useCallback((item, index) => `${index}-${item}`, []);
  // Fotoğraf genişliği sabit olduğu için kaydırma konumları doğrudan hesaplanır.
  const getPhotoLayout = useCallback(
    (_, index) => ({ length: photoWidth, offset: photoWidth * index, index }),
    [photoWidth]
  );

  if (!listing) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="alert-circle-outline"
          title="İlan bulunamadı"
          description="Bu ilan yayından kaldırılmış olabilir."
          actionTitle="İlanlara Dön"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const photos = Array.isArray(listing.photos) ? listing.photos : [];
  const isOwner = uid && listing.ownerId === uid;
  const pricePerDonum = listing.area > 0 ? listing.price / listing.area : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {photos.length > 0 ? (
        <View>
          <FlatList
            data={photos}
            renderItem={renderPhoto}
            keyExtractor={photoKey}
            getItemLayout={getPhotoLayout}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          />
          {photos.length > 1 ? (
            <Text style={styles.photoHint}>{photos.length} fotoğraf · yana kaydırın</Text>
          ) : null}
        </View>
      ) : (
        <View style={[styles.photo, styles.placeholder, { width: photoWidth }]}>
          <Ionicons name="image-outline" size={56} color={colors.textMuted} />
          <Text style={styles.placeholderText}>Fotoğraf eklenmemiş</Text>
        </View>
      )}

      <Text style={styles.title}>{listing.title}</Text>
      <Text style={styles.location}>
        {listing.district}, {listing.city}
      </Text>

      <View style={styles.priceCard}>
        <Text style={styles.price}>{formatTL(listing.price)}</Text>
        <Text style={styles.priceSub}>
          {formatDonum(listing.area)}
          {pricePerDonum !== null ? ` · dönümü ${formatTL(pricePerDonum)}` : ''}
        </Text>
      </View>

      {listing.description ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Açıklama</Text>
          <Text style={styles.description}>{listing.description}</Text>
        </View>
      ) : null}

      <FieldReportCard rows={listing.reportCard} />

      <View style={styles.warning}>
        <Ionicons name="shield-checkmark-outline" size={24} color={colors.warning} />
        <Text style={styles.warningText}>
          Güvenliğiniz için: tapuda işlem yapılmadan kapora veya ön ödeme göndermeyin. Tarlayı
          yerinde görün ve tapu kaydını kontrol edin.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Satıcı</Text>
        <Text style={styles.description}>{listing.ownerName || 'İlan sahibi'}</Text>
        <Text style={styles.meta}>İlan tarihi: {formatDateTime(listing.createdAt)}</Text>
      </View>

      {isOwner ? (
        <PrimaryButton
          title="İlanı Kaldır"
          icon="trash-outline"
          variant="danger"
          onPress={handleDelete}
          loading={deleting}
          style={styles.button}
        />
      ) : (
        <PrimaryButton
          title={`Satıcıyı Ara (${listing.phone})`}
          icon="call-outline"
          onPress={handleCall}
          style={styles.button}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  photo: { height: 240, borderRadius: radius.lg, backgroundColor: colors.earthLight },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { marginTop: spacing.sm, color: colors.textMuted, fontSize: font.md },
  photoHint: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text, marginTop: spacing.lg },
  location: { fontSize: font.md, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  priceCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  price: { fontSize: font.xxl, fontWeight: '800', color: colors.white },
  priceSub: { fontSize: font.md, color: colors.primaryLight, marginTop: 2 },
  card: { ...card, marginBottom: spacing.lg },
  cardTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  description: { fontSize: font.md, color: colors.text, lineHeight: 24 },
  meta: { fontSize: font.sm, color: colors.textMuted, marginTop: spacing.xs },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  warningText: { flex: 1, marginLeft: spacing.sm, fontSize: font.sm, color: colors.text, lineHeight: 20 },
  button: { marginBottom: spacing.md },
});
