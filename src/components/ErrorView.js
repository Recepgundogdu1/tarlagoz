// Hata kutusu. onRetry verilirse "Tekrar Dene" düğmesi gösterir.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import { card, colors, font, radius, spacing, weight } from '../constants/theme';

function ErrorView({ message = 'Bir hata oluştu.', onRetry = null, style = null }) {
  return (
    <View style={[styles.container, style]} accessibilityRole="alert">
      <View style={styles.iconCircle}>
        <Ionicons name="cloud-offline-outline" size={30} color={colors.danger} />
      </View>
      <Text style={styles.title}>Bir sorun oluştu</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <PrimaryButton
          title="Tekrar Dene"
          icon="refresh"
          variant="outline"
          onPress={onRetry}
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...card, margin: spacing.lg, padding: spacing.xl, alignItems: 'center' },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: spacing.md, fontSize: font.lg, fontWeight: weight.heavy, color: colors.text },
  message: {
    marginTop: spacing.xs,
    fontSize: font.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: { marginTop: spacing.lg, alignSelf: 'stretch' },
});

export default React.memo(ErrorView);
