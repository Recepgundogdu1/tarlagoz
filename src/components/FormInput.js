// Etiketli metin girişi. Odaklanınca kenarlık yeşile döner; hata varsa kırmızı.
// "suffix" ile sağa birim (TL, kg, dönüm), isteğe bağlı "icon" ile sola ikon eklenir.

import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing, touch, weight } from '../constants/theme';

function FormInput({
  label,
  error = null,
  suffix = null,
  hint = null,
  icon = null,
  style = null,
  onFocus,
  onBlur,
  ...inputProps
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          error ? styles.inputRowError : null,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={20}
            color={error ? colors.danger : focused ? colors.primary : colors.textMuted}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          style={[styles.input, inputProps.multiline ? styles.multiline : null]}
          placeholderTextColor="#A3A89F"
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            if (onBlur) onBlur(e);
          }}
          {...inputProps}
        />
        {suffix ? (
          <View style={styles.suffixPill}>
            <Text style={styles.suffix}>{suffix}</Text>
          </View>
        ) : null}
      </View>
      {error ? (
        <View style={styles.messageRow}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { fontSize: font.sm, fontWeight: weight.bold, color: colors.text, marginBottom: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touch.minHeight,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  inputRowFocused: { borderColor: colors.primary, backgroundColor: '#FDFFFD' },
  inputRowError: { borderColor: colors.danger, backgroundColor: '#FFFBFA' },
  icon: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: font.lg, color: colors.text, paddingVertical: spacing.sm },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  suffixPill: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },
  suffix: { fontSize: font.sm, color: colors.primaryDark, fontWeight: weight.bold },
  messageRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  error: { color: colors.danger, fontSize: font.sm, marginLeft: 4, flex: 1 },
  hint: { color: colors.textMuted, fontSize: font.sm, marginTop: spacing.xs },
});

export default React.memo(FormInput);
