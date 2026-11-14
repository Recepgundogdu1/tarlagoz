// Yerel bildirimler (don uyarısı). Sunucudan gönderilen (push) bildirim
// kullanılmıyor; bildirim telefonun kendisinde üretiliyor.
//
// Tüm çağrılar try/catch içinde: bildirim gönderilemezse uygulamanın geri
// kalanı etkilenmemeli.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { isoToTR } from '../utils/format';

const CHANNEL_ID = 'don-uyarisi';
const SENT_PREFIX = 'tarlagoz:frostSent:';

let initialized = false;

// Uygulama açıkken gelen bildirimin de görünmesini sağlar ve Android
// bildirim kanalını oluşturur. Uygulama açılışında bir kez çağrılır.
export async function initNotifications() {
  if (initialized) return;
  initialized = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true, // eski Expo sürümleri
        shouldShowBanner: true, // yeni Expo sürümleri
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Don ve hava uyarıları',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
  } catch (error) {
    // yok sayılır
  }
}

// Bildirim iznini kontrol eder; yoksa ister. İzin varsa true döner.
export async function ensureNotificationPermission() {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (current.canAskAgain === false) return false;
    const requested = await Notifications.requestPermissionsAsync();
    return Boolean(requested.granted);
  } catch (error) {
    return false;
  }
}

async function sendNow(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    // Android'de kanal belirtilir; trigger null ise bildirim hemen gösterilir.
    trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
  });
}

// Bir tarla için don uyarısı gönderir.
// Aynı tarla ve aynı don günü için yalnızca bir kez bildirim atılır; aksi
// halde hava her yenilendiğinde aynı uyarı tekrar gelirdi.
// Bildirim gönderildiyse true döner.
export async function sendFrostAlert(field, frostDays) {
  try {
    if (!field || !Array.isArray(frostDays) || frostDays.length === 0) return false;
    const first = frostDays[0];
    const key = `${SENT_PREFIX}${field.id}:${first.date}`;
    const already = await AsyncStorage.getItem(key);
    if (already) return false;

    const allowed = await ensureNotificationPermission();
    if (!allowed) return false;

    const temp = Math.round(first.tMin);
    await sendNow(
      `Don uyarısı: ${field.name}`,
      `${isoToTR(first.date)} tarihinde en düşük sıcaklık ${temp}°C bekleniyor. Önlem almayı unutmayın.`
    );
    await AsyncStorage.setItem(key, '1');
    return true;
  } catch (error) {
    return false;
  }
}

// Profil ekranındaki "Test bildirimi" düğmesi için.
// İzin yoksa false döner; ekran kullanıcıya açıklama gösterir.
export async function sendTestNotification() {
  await initNotifications();
  const allowed = await ensureNotificationPermission();
  if (!allowed) return false;
  await sendNow('TarlaGöz', 'Bildirimler çalışıyor. Don uyarıları bu şekilde gelecek.');
  return true;
}
