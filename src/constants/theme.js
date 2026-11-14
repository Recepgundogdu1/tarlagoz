// TarlaGöz tasarım sistemi: renk, yazı, boşluk, köşe ve gölge değerleri tek yerde.
// Ekranlarda sabit değer yazmak yerine buradaki belirteçleri (token) kullanıyoruz.
// Not: Eski anahtar adlarının hepsi korunuyor; yeni anahtarlar eklendi.

export const colors = {
  // Ana renk: derin tarla yeşili
  primary: '#2F7A3E',
  primaryDark: '#16432A',
  primaryDeep: '#0F2E1D', // kahraman (hero) kartlar ve başlık
  primaryLight: '#E6F2E8',
  primarySoft: '#CFE5D3',

  // Toprak ve buğday tonları (vurgu)
  earth: '#9A7553',
  earthDark: '#5A4030',
  earthLight: '#F3ECE3',
  wheat: '#D9A93F', // altın/buğday vurgusu
  wheatLight: '#FBF3DE',

  // Zemin ve yüzeyler
  background: '#F6F4EE',
  surface: '#FFFFFF',
  surfaceAlt: '#FBFAF6',

  // Yazı
  text: '#1E2A22',
  textMuted: '#6B726B',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255,255,255,0.72)',

  border: '#E7E3DA',
  borderStrong: '#D6D0C3',

  // Durum renkleri
  danger: '#C2352B',
  dangerLight: '#FCEBE9',
  warning: '#C46A0A',
  warningLight: '#FFF2E0',
  info: '#1E63B5',
  infoLight: '#E6F0FB',
  success: '#2F7A3E',

  white: '#FFFFFF',
  overlay: 'rgba(10,20,14,0.5)',
};

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

export const font = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28, display: 36 };

// Yazı ağırlıkları
export const weight = { regular: '400', medium: '600', bold: '700', heavy: '800' };

// Teknolojiye uzak kullanıcılar için dokunma alanları büyük tutuluyor.
export const touch = { minHeight: 56 };

// Katmanlı, yumuşak gölgeler (iOS gölge + Android elevation)
export const shadows = {
  sm: {
    shadowColor: '#0F2E1D',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#0F2E1D',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  lg: {
    shadowColor: '#0F2E1D',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
};

// Geriye dönük uyumluluk: eski kod "shadow" kullanıyor.
export const shadow = shadows.sm;

// Kart görünümü birçok bileşende aynı olduğu için ortak stil.
export const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  padding: spacing.lg,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.sm,
};

// Koyu yeşil "kahraman" kart (özet panoları için)
export const heroCard = {
  backgroundColor: colors.primaryDeep,
  borderRadius: radius.xl,
  padding: spacing.xl,
  ...shadows.md,
};

// Bölüm başlıkları için ortak yazı stili
export const sectionTitle = {
  fontSize: font.sm,
  fontWeight: weight.heavy,
  color: colors.textMuted,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  marginBottom: spacing.sm,
};
