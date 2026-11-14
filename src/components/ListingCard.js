// Pazar listesindeki ilan kartı: kapak fotoğrafı, başlık, konum, dönüm ve fiyat.

import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from './motion/FadeInView';
import TiltCard from './motion/TiltCard';
import { formatDonum, formatTL } from '../utils/format';
import { card, colors, font, radius, spacing } from '../constants/theme';

function ListingCard({ listing, onPress, index = 0 }) {
  const cover = Array.isArray(listing.photos) && listing.photos.length > 0 ? listing.photos[0] : null;
  const hasReportCard = Array.isArray(listing.reportCard) && listing.reportCard.length > 0;
  const pricePerDonum = listing.area > 0 ? listing.price / listing.area : null;

  return (
    <FadeInView index={index}>
    <TiltCard
      style={styles.card}
      maxTilt={5}
      onPress={() => onPress(listing)}
      accessibilityLabel={`${listing.title}, ${formatTL(listing.price)}`}
    >
      {cover ? (
        <Image source={{ uri: cover }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="image-outline" size={40} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {listing.district}, {listing.city} · {formatDonum(listing.area)}
        </Text>
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.price}>{formatTL(listing.price)}</Text>
            {pricePerDonum !== null ? (
              <Text style={styles.perDonum}>{formatTL(pricePerDonum)} / dönüm</Text>
            ) : null}
          </View>
          {hasReportCard ? (
            <View style={styles.badge}>
              <Ionicons name="ribbon" size={14} color={colors.wheat} />
              <Text style={styles.badgeText}>Karneli</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TiltCard>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  card: { ...card, padding: 0, overflow: 'hidden', marginBottom: spacing.md },
  image: { width: '100%', height: 180, backgroundColor: colors.earthLight },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.lg },
  title: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  location: { fontSize: font.md, color: colors.textMuted, marginTop: 2 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  price: { fontSize: font.xl, fontWeight: '800', color: colors.primaryDark },
  perDonum: { fontSize: font.sm, color: colors.textMuted },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.wheatLight,
    borderWidth: 1,
    borderColor: colors.wheat,
  },
  badgeText: { marginLeft: 4, fontSize: font.sm, color: colors.earthDark, fontWeight: '800' },
});

export default React.memo(ListingCard);
