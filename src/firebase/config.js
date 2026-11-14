// Firebase başlatma. Auth, Firestore ve Storage nesneleri buradan dışa aktarılır;
// uygulamanın geri kalanı Firebase'e yalnızca bu dosya üzerinden ulaşır.

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const extra = Constants.expoConfig?.extra ?? {};
const envConfig = extra.firebase ?? {};

// .env doldurulmamışsa uygulama çökmek yerine "kurulum eksik" ekranı gösterir
// (bkz. App.js). Bu yüzden eksik ayarı burada tespit ediyoruz.
export const isFirebaseConfigured = Boolean(
  envConfig.apiKey && envConfig.projectId && envConfig.appId
);

const firebaseConfig = isFirebaseConfigured
  ? envConfig
  : { apiKey: 'eksik', projectId: 'eksik', appId: 'eksik' };

// Hızlı yenileme (fast refresh) sırasında dosya tekrar çalışır; ikinci kez
// başlatmayı önlemek için mevcut uygulamayı yeniden kullanıyoruz.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Oturumun kalıcı olması için Auth durumunu AsyncStorage'da saklıyoruz.
// initializeAuth ikinci kez çağrılırsa hata fırlatır; o durumda getAuth kullanılır.
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  authInstance = getAuth(app);
}

// ignoreUndefinedProperties: undefined alanlar yazma hatasına yol açmasın.
let dbInstance;
try {
  dbInstance = initializeFirestore(app, { ignoreUndefinedProperties: true });
} catch (error) {
  dbInstance = getFirestore(app);
}

export const auth = authInstance;
export const db = dbInstance;
export const storage = getStorage(app);
export default app;
