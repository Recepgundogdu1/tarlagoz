// Liste boşken gösterilen açıklama ve isteğe bağlı eylem düğmesi.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import FadeInView from './motion/FadeInView';
import { FloatView } from './motion/Attention';
import { colors, font, spacing, weight } from '../constants/theme';

function EmptyState({
  icon = 'leaf-outline',
  title,
  description = null,
  actionTitle = null,
  onAction = null,
}) {
  return (
    <FadeInView style={styles.container}>
      <FloatView style={styles.halo}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={40} color={colors.primary} />
        </View>
      </FloatView>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionTitle && onAction ? (
        <PrimaryButton title={actionTitle} onPress={onAction} style={styles.button} />
      ) : null}
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  halo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.lg,
    fontSize: font.xl,
    fontWeight: weight.heavy,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    marginTop: spacing.sm,
    fontSize: font.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  button: { marginTop: spacing.xl, alignSelf: 'stretch' },
});

export default React.memo(EmptyState);
