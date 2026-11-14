// Uzun listelerden seçim (81 il, ürünler) için aranabilir pencere.
// SelectField: forma konan, dokununca pencereyi açan giriş görünümlü düğme.

import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing, touch } from '../constants/theme';

const ROW_HEIGHT = 56;

// Türkçe harfleri de dikkate alarak küçük harfe çevirir (İ -> i, I -> ı).
function normalize(text) {
  return String(text || '').toLocaleLowerCase('tr-TR');
}

function SelectModal({ visible, title, options, selectedKey = null, onSelect, onClose }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    if (!term) return options;
    return options.filter((o) => normalize(o.label).includes(term));
  }, [options, search]);

  const handleClose = useCallback(() => {
    setSearch('');
    onClose();
  }, [onClose]);

  const handleSelect = useCallback(
    (key) => {
      setSearch('');
      onSelect(key);
    },
    [onSelect]
  );

  const renderItem = useCallback(
    ({ item }) => {
      const selected = item.key === selectedKey;
      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => handleSelect(item.key)}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <Text style={[styles.rowText, selected && styles.rowTextSelected]}>{item.label}</Text>
          {selected ? <Ionicons name="checkmark" size={22} color={colors.primary} /> : null}
        </TouchableOpacity>
      );
    },
    [handleSelect, selectedKey]
  );

  const keyExtractor = useCallback((item) => String(item.key), []);

  // Satır yüksekliği sabit olduğu için FlatList konumları hesaplamak zorunda kalmaz.
  const getItemLayout = useCallback(
    (_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index }),
    []
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>
          {options.length > 8 ? (
            <TextInput
              style={styles.search}
              placeholder="Ara..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
          ) : null}
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={14}
            ListEmptyComponent={<Text style={styles.empty}>Sonuç bulunamadı.</Text>}
          />
        </View>
      </View>
    </Modal>
  );
}

export function SelectField({ label, valueLabel, placeholder = 'Seçin', onPress, error = null }) {
  return (
    <View style={styles.fieldWrapper}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.field, error ? styles.fieldError : null]}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${label || ''} ${valueLabel || placeholder}`}
      >
        <Text style={[styles.fieldText, !valueLabel && styles.fieldPlaceholder]}>
          {valueLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={22} color={colors.textMuted} />
      </TouchableOpacity>
      {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  search: {
    margin: spacing.lg,
    marginBottom: spacing.sm,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: font.md,
    color: colors.text,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowText: { fontSize: font.lg, color: colors.text },
  rowTextSelected: { color: colors.primary, fontWeight: '700' },
  empty: { padding: spacing.xl, textAlign: 'center', color: colors.textMuted, fontSize: font.md },
  fieldWrapper: { marginBottom: spacing.lg },
  fieldLabel: { fontSize: font.md, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  field: {
    minHeight: touch.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  fieldError: { borderColor: colors.danger },
  fieldText: { fontSize: font.lg, color: colors.text, flex: 1 },
  fieldPlaceholder: { color: colors.textMuted },
  fieldErrorText: { color: colors.danger, fontSize: font.sm, marginTop: spacing.xs },
});

export default React.memo(SelectModal);
