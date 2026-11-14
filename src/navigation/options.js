// Tüm yığınlarda (stack) ortak başlık görünümü ve gezinme teması.

import { DefaultTheme } from '@react-navigation/native';
import { colors, font } from '../constants/theme';

export const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.primaryDeep },
  headerShadowVisible: false, // başlık altındaki çizgiyi kaldırır, daha temiz görünüm
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '800', fontSize: font.lg },
  headerBackTitle: 'Geri',
  contentStyle: { backgroundColor: colors.background },
  animation: 'slide_from_right',
};

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};
