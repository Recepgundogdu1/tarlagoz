// Yükleniyor göstergesi. fullScreen verilirse ekranı kaplar.

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Logo3D from './motion/Logo3D';
import { colors, font, spacing, weight } from '../constants/theme';

function Loading({ message = 'Yükleniyor...', fullScreen = false }) {
  return (
    <View
      style={[styles.container, fullScreen && styles.fullScreen]}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      {fullScreen ? (
        <Logo3D size={64} ringColor={colors.primary} />
      ) : (
        <ActivityIndicator size="large" color={colors.primary} />
      )}
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  fullScreen: { flex: 1, backgroundColor: colors.background },
  text: {
    marginTop: spacing.md,
    fontSize: font.md,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: weight.medium,
  },
});

export default React.memo(Loading);
