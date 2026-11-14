// Az sayıda seçenek arasından tek seçim (örn. masraf kalemi, tarla seçimi).
// Seçenekler satırlara sarılan büyük düğmeler olarak gösterilir.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '../constants/theme';

function ChipSelect({ label = null, options, value, onChange, error = null }) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.key === value;
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => onChange(option.key)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              {option.icon ? (
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={selected ? colors.white : colors.primaryDark}
                  style={styles.icon}
                />
              ) : null}
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { fontSize: font.sm, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  icon: { marginRight: spacing.xs },
  chipText: { fontSize: font.md, color: colors.primaryDark, fontWeight: '600' },
  chipTextSelected: { color: colors.white },
  error: { color: colors.danger, fontSize: font.sm, marginTop: spacing.xs },
});

export default React.memo(ChipSelect);
