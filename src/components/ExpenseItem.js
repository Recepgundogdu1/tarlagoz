// Masraf listesindeki tek satır. Çevrimdışı eklenip henüz gönderilmemiş
// masraflar "Gönderilecek" etiketiyle işaretlenir. Çöp kutusuna basınca silinir.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from './motion/FadeInView';
import { getCategory } from '../constants/expenseCategories';
import { formatTL, isoToTR } from '../utils/format';
import { colors, font, radius, shadows, spacing } from '../constants/theme';

function ExpenseItem({ expense, onDelete = null }) {
  const category = getCategory(expense.category);

  return (
    <FadeInView style={styles.row} distance={10}>
      <View style={styles.iconCircle}>
        <Ionicons name={category.icon} size={22} color={colors.primaryDark} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.category} numberOfLines={1}>
          {category.label}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {isoToTR(expense.date)}
          {expense.note ? ` · ${expense.note}` : ''}
        </Text>
        {expense.pending ? (
          <View style={styles.pendingPill}>
            <Ionicons name="cloud-offline-outline" size={12} color={colors.warning} />
            <Text style={styles.pendingText}>Gönderilecek</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.amount}>{formatTL(expense.amount)}</Text>
      {onDelete ? (
        <TouchableOpacity
          onPress={() => onDelete(expense)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={`${category.label} masrafını sil`}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </TouchableOpacity>
      ) : null}
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1, marginHorizontal: spacing.md },
  category: { fontSize: font.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: font.lg, fontWeight: '800', color: colors.text },
  deleteButton: { marginLeft: spacing.md },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.warningLight,
  },
  pendingText: { marginLeft: 4, fontSize: font.xs, color: colors.warning, fontWeight: '700' },
});

export default React.memo(ExpenseItem);
