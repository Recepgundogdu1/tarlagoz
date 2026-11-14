// Cihaz özellikleri (kamera, galeri, konum) için ortak yardımcılar.
// İzin reddedilirse Türkçe mesaj taşıyan bir hata fırlatılır; ekranlar bu
// mesajı doğrudan kullanıcıya gösterir.

import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { userError } from './errors';

// Kameradan fotoğraf çeker veya galeriden seçer.
// Kullanıcı vazgeçerse null döner. base64: true verilirse görselin base64
// metni de döner (yapay zekâ servisine göndermek için).
export async function pickImage({ fromCamera = false, base64 = false, quality = 0.5 } = {}) {
  if (fromCamera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw userError(
        'Kamera izni verilmedi. Telefonun Ayarlar bölümünden TarlaGöz için kamera iznini açın.'
      );
    }
  }
  // Galeriden seçim için ayrıca izin istemeye gerek yoktur; sistemin fotoğraf
  // seçicisi yalnızca kullanıcının seçtiği fotoğrafı uygulamaya verir.

  const options = {
    mediaTypes: ['images'],
    quality,
    base64,
    allowsEditing: false,
    exif: false, // konum gibi gizli bilgiler fotoğrafla birlikte gelmesin
  };

  const result = fromCamera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (!result || result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }
  const asset = result.assets[0];
  return { uri: asset.uri, base64: asset.base64 || null };
}

// Telefonun o anki konumunu döner: { latitude, longitude }
export async function getCurrentLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw userError(
      'Konum izni verilmedi. Telefonun Ayarlar bölümünden TarlaGöz için konum iznini açın.'
    );
  }
  const servicesOn = await Location.hasServicesEnabledAsync();
  if (!servicesOn) {
    throw userError('Telefonun konum servisi kapalı. Konumu açıp tekrar deneyin.');
  }

  let position = null;
  try {
    position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch (error) {
    // Kapalı alanda GPS bulunamazsa en son bilinen konuma düşüyoruz.
    position = await Location.getLastKnownPositionAsync();
  }
  if (!position || !position.coords) {
    throw userError('Konum alınamadı. Açık alanda tekrar deneyin.');
  }
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

// Haritaların açılışta göstereceği varsayılan bölge (Türkiye'nin ortası).
export const TURKEY_REGION = {
  latitude: 39.0,
  longitude: 35.2,
  latitudeDelta: 12,
  longitudeDelta: 16,
};
