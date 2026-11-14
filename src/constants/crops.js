// Ürünler ve varsayılan değerler.
//
// ÖNEMLİ: Aşağıdaki verim, maliyet ve fiyat rakamları TEMSİLİDİR. Bölgeye,
// yıla ve sulama durumuna göre çok değişir. Uygulama bu değerleri yalnızca
// başlangıç tahmini olarak kullanır; kullanıcı kendi tarlası için verimi ve
// fiyatı değiştirebilir. Yayına almadan önce güncel bölgesel verilerle
// değiştirin.
//
// yieldPerDonum : dönüm başına verim (kg)
// costPerDonum  : dönüm başına tahmini toplam maliyet (TL)
// pricePerKg    : tahmini satış fiyatı (TL/kg)

export const CROPS = [
  { key: 'bugday', label: 'Buğday', yieldPerDonum: 400, costPerDonum: 4500, pricePerKg: 14 },
  { key: 'arpa', label: 'Arpa', yieldPerDonum: 380, costPerDonum: 3800, pricePerKg: 12 },
  { key: 'misir', label: 'Mısır (dane)', yieldPerDonum: 1100, costPerDonum: 9000, pricePerKg: 11 },
  { key: 'pamuk', label: 'Pamuk (kütlü)', yieldPerDonum: 500, costPerDonum: 11000, pricePerKg: 30 },
  { key: 'aycicegi', label: 'Ayçiçeği', yieldPerDonum: 250, costPerDonum: 4500, pricePerKg: 26 },
  { key: 'mercimek', label: 'Kırmızı Mercimek', yieldPerDonum: 180, costPerDonum: 3500, pricePerKg: 32 },
  { key: 'nohut', label: 'Nohut', yieldPerDonum: 150, costPerDonum: 3500, pricePerKg: 38 },
  { key: 'seker_pancari', label: 'Şeker Pancarı', yieldPerDonum: 6500, costPerDonum: 14000, pricePerKg: 3 },
  { key: 'fistik', label: 'Antep Fıstığı', yieldPerDonum: 100, costPerDonum: 8000, pricePerKg: 250 },
  { key: 'zeytin', label: 'Zeytin', yieldPerDonum: 300, costPerDonum: 6000, pricePerKg: 45 },
  { key: 'uzum', label: 'Üzüm', yieldPerDonum: 1200, costPerDonum: 12000, pricePerKg: 20 },
  { key: 'findik', label: 'Fındık', yieldPerDonum: 130, costPerDonum: 7000, pricePerKg: 200 },
  { key: 'domates', label: 'Domates', yieldPerDonum: 8000, costPerDonum: 30000, pricePerKg: 6 },
  { key: 'biber', label: 'Biber', yieldPerDonum: 3500, costPerDonum: 28000, pricePerKg: 14 },
];

export const CROP_KEYS = CROPS.map((c) => c.key);

// Bilinmeyen bir anahtar gelirse uygulama çökmesin diye güvenli bir varsayılan döner.
export function getCrop(key) {
  return (
    CROPS.find((c) => c.key === key) || {
      key: key || 'bilinmiyor',
      label: 'Bilinmeyen ürün',
      yieldPerDonum: 0,
      costPerDonum: 0,
      pricePerKg: 0,
    }
  );
}
