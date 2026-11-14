// İskelet (skeleton) yükleme görünümü: içerik gelene kadar, gelecek içeriğin
// kaba şekli üzerinde soldan sağa kayan bir parıltı gösterilir. Boş ekranda
// dönen çark yerine kullanıcıya "içerik geliyor" hissi verir.

import React, { useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRepeat } from '../../utils/motion';
import { colors, radius, spacing } from '../../constants/theme';

export function SkeletonBlock({ height = 16, width = '100%', borderRadius = radius.sm, style = null }) {
  const [blockWidth, setBlockWidth] = useState(0);
  const sweep = useRepeat(1300);

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-blockWidth, blockWidth],
  });

  return (
    <View
      style={[styles.block, { height, width, borderRadius }, style]}
      onLayout={(event) => setBlockWidth(event.nativeEvent.layout.width)}
    >
      {blockWidth > 0 ? (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

// Tarla listesinin iskeleti: özet kartı + üç tarla kartı.
export function FieldListSkeleton() {
  return (
    <View style={styles.screen} accessibilityRole="progressbar" accessibilityLabel="Yükleniyor">
      <SkeletonBlock height={170} borderRadius={radius.xl} style={styles.gap} />
      <View style={styles.row}>
        <SkeletonBlock height={56} width="48%" borderRadius={radius.md} />
        <SkeletonBlock height={56} width="48%" borderRadius={radius.md} />
      </View>
      {[0, 1, 2].map((key) => (
        <View key={key} style={styles.card}>
          <View style={styles.cardHeader}>
            <SkeletonBlock height={44} width={44} borderRadius={radius.md} />
            <View style={styles.cardLines}>
              <SkeletonBlock height={18} width="60%" />
              <SkeletonBlock height={12} width="85%" style={styles.lineGap} />
            </View>
          </View>
          <SkeletonBlock height={60} borderRadius={radius.md} style={styles.lineGap} />
        </View>
      ))}
    </View>
  );
}

// İlan listesinin iskeleti: iki fotoğraflı kart.
export function ListingListSkeleton() {
  return (
    <View style={styles.screen} accessibilityRole="progressbar" accessibilityLabel="Yükleniyor">
      {[0, 1].map((key) => (
        <View key={key} style={[styles.card, styles.listingCard]}>
          <SkeletonBlock height={180} borderRadius={0} />
          <View style={styles.listingBody}>
            <SkeletonBlock height={18} width="75%" />
            <SkeletonBlock height={12} width="50%" style={styles.lineGap} />
            <SkeletonBlock height={24} width="40%" style={styles.lineGap} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.border, overflow: 'hidden' },
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  gap: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardLines: { flex: 1, marginLeft: spacing.md },
  lineGap: { marginTop: spacing.sm },
  listingCard: { padding: 0, overflow: 'hidden' },
  listingBody: { padding: spacing.lg },
});
