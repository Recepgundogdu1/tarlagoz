// Uygulamanın standart düğmesi. Büyük dokunma alanı, yükleniyor durumu,
// basınca hafif küçülme animasyonu ve beş görünüm:
// primary (yeşil), secondary (toprak), outline, danger (kırmızı), ghost (sade).

import React, { useCallback, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticTap } from '../utils/motion';
import { colors, font, radius, shadows, spacing, touch, weight } from '../constants/theme';

const VARIANTS = {
  primary: { background: colors.primary, text: colors.white, border: colors.primary, raised: true },
  secondary: { background: colors.earthDark, text: colors.white, border: colors.earthDark, raised: true },
  outline: { background: colors.surface, text: colors.primaryDark, border: colors.primarySoft, raised: false },
  danger: { background: colors.danger, text: colors.white, border: colors.danger, raised: true },
  ghost: { background: 'transparent', text: colors.primaryDark, border: 'transparent', raised: false },
};

function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon = null,
  style = null,
}) {
  const palette = VARIANTS[variant] || VARIANTS.primary;
  const inactive = disabled || loading;

  // Dışarıdan gelen stil sarmalayıcıya (konum, flex, boşluk) uygulanır;
  // yükseklik ayarı (minHeight) varsa düğmenin kendisine aktarılır.
  const flat = StyleSheet.flatten(style) || {};
  const { minHeight, ...outerStyle } = flat;

  // Basma animasyonu: useRef ile Animated.Value bir kez oluşturulur, render tetiklemez.
  const scale = useRef(new Animated.Value(1)).current;
  const animateTo = useCallback(
    (value) => {
      Animated.spring(scale, {
        toValue: value,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }).start();
    },
    [scale]
  );

  // Basınca hafif titreşim, ardından asıl işlem.
  const handlePress = useCallback(() => {
    hapticTap();
    if (onPress) onPress();
  }, [onPress]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, outerStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: inactive, busy: loading }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: palette.background, borderColor: palette.border },
          minHeight !== undefined ? { minHeight } : null,
          palette.raised && !inactive ? shadows.sm : null,
          pressed && styles.pressed,
          inactive && styles.inactive,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={palette.text} />
        ) : (
          <View style={styles.content}>
            {icon ? (
              <Ionicons name={icon} size={22} color={palette.text} style={styles.icon} />
            ) : null}
            <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touch.minHeight,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.92 },
  inactive: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  title: { fontSize: font.lg, fontWeight: weight.bold, letterSpacing: 0.2 },
});

export default React.memo(PrimaryButton);
