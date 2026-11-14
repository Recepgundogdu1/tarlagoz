# TarlaGöz

Çiftçilerin tarla masraflarını takip edip sezon boyunca kâr-zarar durumunu gördüğü mobil uygulama.
Expo (React Native, JavaScript) + Firebase (Auth, Firestore, Storage) + Redux Toolkit.

## 1. Kurulum

Gerekenler: Node.js 20 veya üstü, telefonda **Expo Go** uygulaması (veya Android emülatörü).

```bash
# 1) Boş bir Expo projesi oluşturun
npx create-expo-app@latest tarlagoz --template blank
cd tarlagoz

# 2) Bağımlılıkları kurun (expo install, Expo sürümünüzle uyumlu sürümleri seçer)
npx expo install firebase @reduxjs/toolkit react-redux axios \
  @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack \
  react-native-screens react-native-safe-area-context \
  react-native-maps expo-location expo-image-picker expo-notifications \
  @react-native-async-storage/async-storage expo-constants expo-status-bar @expo/vector-icons
```

3) Bu paketteki dosyaları proje klasörüne kopyalayın (aynı adlı dosyaların üzerine yazın):

- `App.js`, `app.config.js`, `.env.example`, `firestore.rules`, `storage.rules`
- `src/` klasörünün tamamı

Şablonun oluşturduğu `app.json` dosyasını **silmeyin**; simge ve açılış ekranı ayarları oradan okunur.

4) `.env` dosyasını oluşturun:

```bash
cp .env.example .env
```

`.gitignore` dosyanıza `.env` satırını ekleyin.

## 2. Firebase ayarları

1. [Firebase Console](https://console.firebase.google.com)'da yeni proje oluşturun.
2. **Authentication > Sign-in method**: "E-posta/Şifre" yöntemini etkinleştirin.
3. **Firestore Database**: veritabanı oluşturun (üretim modunda). **Kurallar** sekmesine `firestore.rules` içeriğini yapıştırıp yayınlayın.
4. **Storage**: etkinleştirin. **Kurallar** sekmesine `storage.rules` içeriğini yapıştırıp yayınlayın.
5. **Proje ayarları > Uygulamalarınız**: bir **Web uygulaması** (</>) ekleyin. Gösterilen `firebaseConfig` değerlerini `.env` dosyasına yazın:

```
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
```

Firestore'da ek dizin (index) tanımlamanız gerekmez; sorgular tek alan üzerinden yapılır.

## 3. Yapay zekâ servisi (isteğe bağlı)

Hastalık tespiti ve fiş okuma `src/services/aiService.js` içindeki tek fonksiyonun (`analyzeImage`) arkasındadır.

- `.env` içinde `AI_API_URL` ve `AI_API_KEY` **boşsa** uygulama **demo modunda** çalışır: fotoğraf incelenmez, örnek sonuç gösterilir ve ekranda bunun demo olduğu yazar.
- Gerçek analiz için OpenAI uyumlu bir "chat completions" adresi, anahtar ve görsel destekli bir model adı yazın.
- Kendi modelinize geçerken yalnızca `aiService.js` içindeki `callProvider` fonksiyonunu değiştirin.

**Güvenlik:** `.env` içindeki `AI_API_KEY` uygulama paketine gömülür ve paketi açan herkes okuyabilir. Geliştirme için sorun değil; yayına çıkmadan önce anahtarı bir sunucuya (ör. Firebase Cloud Functions) taşıyın.

## 4. Çalıştırma

```bash
npx expo start -c
```

Terminaldeki QR kodu Expo Go ile okutun (telefon ve bilgisayar aynı Wi-Fi'da olmalı) veya Android emülatörü için `a` tuşuna basın.

`.env` dosyasını her değiştirdiğinizde `-c` ile (önbelleği temizleyerek) yeniden başlatın.

### Bilinen sınırlar

- **Expo Go + bildirim:** Yerel bildirimler (don uyarısı) Expo Go'da çalışır. Android'de Expo Go açılışta "push bildirimleri desteklenmiyor" uyarısı yazabilir; bu uygulama push kullanmadığı için etkilemez.
- **Harita:** Expo Go'da ek ayar gerekmez. Mağazaya çıkacak bağımsız Android derlemesinde Google Maps API anahtarı tanımlamanız gerekir (Expo'nun `react-native-maps` belgesine bakın).
- **Çevrimdışı:** İnternet yokken yalnızca **masraf ekleme** çalışır (kuyruğa alınır) ve son indirilen tarla/masraf listesi görüntülenir. Tarla ekleme, ilan verme ve teşhis internet ister.
- **Ürün varsayılanları:** `src/constants/crops.js` içindeki verim, maliyet ve fiyatlar temsilidir; güncel bölgesel verilerle değiştirin.

## 5. Dosya haritası

| Dosya | Görevi |
| --- | --- |
| `App.js` | Giriş noktası; store, hata sınırı, kurulum kontrolü |
| `app.config.js` | Expo ayarları; `.env` değerlerini uygulamaya taşır |
| `firestore.rules`, `storage.rules` | Güvenlik kuralları |
| `src/firebase/config.js` | Firebase başlatma, kalıcı oturum |
| `src/store/authSlice.js` | Giriş, kayıt, çıkış, şifre sıfırlama |
| `src/store/fieldsSlice.js` | Tarlalar, sezon kapatma, çizim taslağı |
| `src/store/expensesSlice.js` | Masraflar, çevrimdışı kuyruk eşitleme, fiş taslağı |
| `src/store/listingsSlice.js` | İlanlar ve filtreler |
| `src/store/weatherSlice.js` | Tarla bazında hava tahmini, don uyarısı tetikleme |
| `src/services/fieldService.js` | Tarla Firestore işlemleri |
| `src/services/expenseService.js` | Masraf Firestore işlemleri |
| `src/services/listingService.js` | İlan Firestore işlemleri, fotoğraf yükleme |
| `src/services/diagnosisService.js` | Teşhis kayıtları |
| `src/services/storageService.js` | Storage'a fotoğraf yükleme/silme |
| `src/services/weatherService.js` | Open-Meteo 7 günlük tahmin |
| `src/services/aiService.js` | Görsel yapay zekâ soyutlaması (teşhis, fiş) |
| `src/services/notificationService.js` | Yerel bildirim, don uyarısı |
| `src/services/offlineQueue.js` | Çevrimdışı masraf kuyruğu, önbellek, bağlantı kontrolü |
| `src/utils/calculations.js` | Dönüm, kâr-zarar, başabaş, karşılaştırma, karne |
| `src/utils/format.js` | TL, sayı, tarih biçimlendirme ve ayrıştırma |
| `src/utils/validators.js` | Form doğrulama, Türkçe hata mesajları |
| `src/utils/errors.js` | Firebase/ağ hatalarını Türkçeye çevirme |
| `src/utils/device.js` | Kamera, galeri ve konum yardımcıları |
| `src/constants/*` | Tema, ürünler, masraf kalemleri, iller |
| `src/components/*` | Yeniden kullanılan arayüz bileşenleri |
| `src/navigation/*` | Kök gezgin, giriş yığını, sekmeler ve sekme yığınları |
| `src/screens/*` | Ekranlar |

İstenen yapıya ek olarak eklenen dosyalar: `diagnosisService`, `storageService`, `utils/errors`, `utils/device`, `constants/cities`, `components/FormInput`, `ChipSelect`, `SelectModal`, `navigation/options`, `screens/fields/CloseSeasonScreen`, `storage.rules`.

## 6. Veri modeli (Firestore)

- `users/{uid}`: `name, email, createdAt`
- `fields/{id}`: `ownerId, name, crop, area, season, location, polygon[], expectedYield, expectedPrice, pastSeasons[], createdAt`
- `expenses/{id}`: `ownerId, fieldId, season, category, amount, date, note, source, createdAt`
- `diagnoses/{id}`: `ownerId, fieldId, fieldName, disease, confidence, advice, healthy, demo, imageUrl, imagePath, createdAt`
- `listings/{id}`: `ownerId, ownerName, phone, fieldId, title, price, area, city, district, description, location, photos[], photoPaths[], reportCard[], createdAt`

Tarla Karnesi ilan oluşturulurken hesaplanıp ilanın içine kopyalanır (`reportCard`). Böylece alıcı karneyi görür ama satıcının özel masraf kayıtlarına erişemez.

## 7. Test senaryoları

Her maddeyi sırayla deneyin ve işaretleyin.

**Oturum**
- [ ] Geçersiz e-posta ve 6 karakterden kısa şifreyle kayıt denemesi Türkçe hata gösteriyor.
- [ ] Kayıt olunca doğrudan Tarlalarım ekranı açılıyor.
- [ ] Uygulamayı tamamen kapatıp açınca oturum açık kalıyor.
- [ ] Yanlış şifreyle giriş "E-posta veya şifre hatalı" diyor.
- [ ] Çıkış yapınca giriş ekranına dönülüyor.

**Tarla**
- [ ] Boş formla "Tarlayı Kaydet" her zorunlu alan için hata gösteriyor.
- [ ] "Haritada Çiz" ile 4 köşe işaretlenince dönüm hesaplanıp forma geliyor.
- [ ] Ürün seçince verim ve fiyat varsayılanları doluyor.
- [ ] Konum izni reddedilince Türkçe açıklama çıkıyor, uygulama çökmüyor.
- [ ] Kaydedilen tarla listede ve Harita sekmesinde görünüyor.

**Masraf ve kâr panosu**
- [ ] Masraf ekleyince toplam masraf, dönüm başı maliyet ve başabaş fiyatı güncelleniyor.
- [ ] Elle kontrol: 100 dönüm, 500 kg/dönüm, 30 TL/kg, 1.350.000 TL masraf → hasat 50.000 kg, gelir 1.500.000 TL, net kâr 150.000 TL, başabaş 27,00 TL/kg.
- [ ] Beklenen fiyatı başabaşın altına çekince kırmızı zarar kartı çıkıyor.
- [ ] Kategori dağılımı yüzdeleri toplamı %100.
- [ ] Çöp kutusuyla masraf siliniyor ve rakamlar güncelleniyor.

**Fiş okuma**
- [ ] "Fiş Tara" → fotoğraf → sonuç → "Forma Aktar" formu dolduruyor; kullanıcı onaylamadan kayıt oluşmuyor.
- [ ] Yapay zekâ ayarı yokken ekranda "Demo modu" uyarısı görünüyor.
- [ ] Kamera izni reddedilince Türkçe açıklama çıkıyor.

**Çevrimdışı**
- [ ] Uçak modunda masraf ekleyince "Telefona kaydedildi" mesajı çıkıyor, masraf "Gönderilecek" etiketiyle listede.
- [ ] Uçak modunda uygulamayı kapatıp açınca tarlalar ve bekleyen masraf hâlâ görünüyor.
- [ ] İnterneti açıp uygulamayı öne getirince (en geç 1 dakikada) etiket kalkıyor; Firestore'da kayıt tek.

**Ne ekelim?**
- [ ] Dönüm yazıp "Hesapla" denince ürünler net kâra göre sıralanıyor.
- [ ] Bir ürünün fiyatını değiştirip "Hesapla" denince sıra değişiyor.

**Hastalık tespiti**
- [ ] Fotoğraf çek → sonuç ekranı hastalık adı, güven oranı ve öneri gösteriyor.
- [ ] Sonuç, seçili tarlanın geçmiş teşhislerinde listeleniyor.
- [ ] Teşhis silinebiliyor.

**Hava ve don**
- [ ] Konumu olan tarlanın detayında 7 günlük tahmin görünüyor.
- [ ] Profil > "Test Bildirimi Gönder" bildirimi gösteriyor.
- [ ] Don testi: `src/services/weatherService.js` içinde `FROST_THRESHOLD_C` değerini geçici olarak 50 yapın; tarla listesi açılınca don bildirimi gelmeli. Sonra 0'a geri alın.

**Sezon ve karne**
- [ ] "Sezonu Kapat" ile hasat ve fiyat girilince karnede "Gerçekleşen" satırı oluşuyor, tarla yeni sezona geçiyor.

**Pazar**
- [ ] İlan verirken eksik alanlar hata gösteriyor.
- [ ] Fotoğraflı ilan yayınlanıyor ve listede görünüyor.
- [ ] İl, en yüksek fiyat ve en az alan filtreleri çalışıyor.
- [ ] İlan detayında Tarla Karnesi görünüyor.
- [ ] İkinci bir hesapla girince ilan görünüyor ama "İlanı Kaldır" düğmesi yok.

**Güvenlik kuralları** (Firebase Console > Firestore > Kurallar > Rules Playground)
- [ ] Başka kullanıcının `fields` belgesini okuma isteği reddediliyor.
- [ ] `ownerId` alanı başka kullanıcı olan `expenses` oluşturma isteği reddediliyor.
- [ ] Oturumsuz `listings` okuma isteği reddediliyor.
