// Expo uygulama ayarları. .env dosyasındaki değerler burada okunur ve
// "extra" alanı üzerinden uygulamaya taşınır (expo-constants ile erişilir).
//
// Expo CLI, proje kökündeki .env dosyasını bu dosya çalışmadan önce
// process.env içine yükler. .env değiştiğinde "npx expo start -c" ile
// yeniden başlatın.
//
// Şablonun oluşturduğu app.json dosyasını SİLMEYİN: simge ve açılış ekranı
// ayarları oradan "config" parametresiyle buraya gelir.

export default ({ config }) => ({
  ...config,
  name: 'TarlaGöz',
  slug: 'tarlagoz',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  ios: {
    ...(config.ios || {}),
    supportsTablet: true,
    bundleIdentifier: 'com.alpotech.tarlagoz',
  },
  android: {
    ...(config.android || {}),
    package: 'com.alpotech.tarlagoz',
  },
  plugins: [
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'TarlaGöz, tarlanızı haritada göstermek ve hava tahminini getirmek için konumunuzu kullanır.',
      },
    ],
    [
      'expo-image-picker',
      {
        cameraPermission:
          'TarlaGöz, fiş ve bitki fotoğrafı çekebilmeniz için kamerayı kullanır.',
        photosPermission:
          'TarlaGöz, galeriden fiş, bitki ve tarla fotoğrafı seçebilmeniz için fotoğraflarınıza erişir.',
      },
    ],
    'expo-notifications',
  ],
  extra: {
    ...(config.extra || {}),
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || '',
    },
    ai: {
      apiUrl: process.env.AI_API_URL || '',
      apiKey: process.env.AI_API_KEY || '',
      model: process.env.AI_MODEL || '',
    },
  },
});
