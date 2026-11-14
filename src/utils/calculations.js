// Uygulamadaki tüm hesaplar bu dosyada: dönüm, kâr-zarar, başabaş fiyatı,
// ürün karşılaştırması ve Tarla Karnesi. Dosya React'e veya Firebase'e bağlı
// değildir; bu yüzden tek başına test edilebilir.

import { CROPS, getCrop } from '../constants/crops';
import { EXPENSE_CATEGORIES, getCategory } from '../constants/expenseCategories';

const EARTH_RADIUS_M = 6378137; // WGS84 ekvator yarıçapı
export const M2_PER_DONUM = 1000; // 1 dönüm (dekar) = 1000 m²

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// Haritada çizilen çokgenin alanı (m²).
// Küre üzerinde alan formülü kullanılır (Google Maps'in computeArea yöntemiyle
// aynı). coords: [{ latitude, longitude }, ...] en az 3 nokta.
export function polygonAreaM2(coords) {
  if (!Array.isArray(coords) || coords.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < coords.length; i += 1) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    total +=
      toRad(p2.longitude - p1.longitude) *
      (2 + Math.sin(toRad(p1.latitude)) + Math.sin(toRad(p2.latitude)));
  }
  return Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

export function m2ToDonum(m2) {
  return safeNumber(m2) / M2_PER_DONUM;
}

// Çokgenin dönüm cinsinden alanı, bir ondalık basamağa yuvarlanmış.
export function polygonAreaDonum(coords) {
  return Math.round(m2ToDonum(polygonAreaM2(coords)) * 10) / 10;
}

// Çokgenin orta noktası (köşelerin ortalaması). Hava tahmini için yeterli.
export function polygonCenter(coords) {
  if (!Array.isArray(coords) || coords.length === 0) return null;
  const sum = coords.reduce(
    (acc, p) => ({
      latitude: acc.latitude + p.latitude,
      longitude: acc.longitude + p.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );
  return {
    latitude: sum.latitude / coords.length,
    longitude: sum.longitude / coords.length,
  };
}

export function sumExpenses(expenses) {
  if (!Array.isArray(expenses)) return 0;
  return round2(expenses.reduce((acc, e) => acc + safeNumber(e.amount), 0));
}

// Bir tarlanın belirli bir sezonuna ait masrafları seçer.
export function expensesForFieldSeason(expenses, fieldId, season) {
  if (!Array.isArray(expenses)) return [];
  return expenses.filter(
    (e) => e.fieldId === fieldId && (season === undefined || e.season === season)
  );
}

// Kategori dağılımı: [{ key, label, icon, total, ratio }] büyükten küçüğe.
export function categoryBreakdown(expenses) {
  const total = sumExpenses(expenses);
  const totals = {};
  (expenses || []).forEach((e) => {
    const key = getCategory(e.category).key;
    totals[key] = (totals[key] || 0) + safeNumber(e.amount);
  });
  return EXPENSE_CATEGORIES.filter((c) => totals[c.key] > 0)
    .map((c) => ({
      key: c.key,
      label: c.label,
      icon: c.icon,
      total: round2(totals[c.key]),
      ratio: total > 0 ? totals[c.key] / total : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// Kâr panosunun çekirdek hesabı.
//
//   dönüm başı maliyet = toplam masraf / dönüm
//   tahmini hasat      = dönüm × verim (kg/dönüm)
//   tahmini gelir      = tahmini hasat × fiyat (TL/kg)
//   net kâr            = tahmini gelir − toplam masraf
//   başabaş fiyatı     = toplam masraf / tahmini hasat
//
// Hasat 0 ise başabaş fiyatı hesaplanamaz; null döner.
export function calculateProfit({ area, yieldPerDonum, pricePerKg, totalExpense }) {
  const a = Math.max(0, safeNumber(area));
  const y = Math.max(0, safeNumber(yieldPerDonum));
  const p = Math.max(0, safeNumber(pricePerKg));
  const cost = Math.max(0, safeNumber(totalExpense));

  const estimatedHarvest = a * y;
  const estimatedRevenue = estimatedHarvest * p;
  const netProfit = estimatedRevenue - cost;

  return {
    area: a,
    yieldPerDonum: y,
    pricePerKg: p,
    totalExpense: round2(cost),
    costPerDonum: a > 0 ? round2(cost / a) : 0,
    estimatedHarvest: round2(estimatedHarvest),
    estimatedRevenue: round2(estimatedRevenue),
    netProfit: round2(netProfit),
    profitPerDonum: a > 0 ? round2(netProfit / a) : 0,
    breakEvenPrice: estimatedHarvest > 0 ? round2(cost / estimatedHarvest) : null,
    isLoss: netProfit < 0,
  };
}

// Tarlanın kullanıcıya özel tahmini varsa onu, yoksa ürünün varsayılanını kullanır.
export function fieldYield(field) {
  const own = Number(field?.expectedYield);
  return Number.isFinite(own) && own > 0 ? own : getCrop(field?.crop).yieldPerDonum;
}

export function fieldPrice(field) {
  const own = Number(field?.expectedPrice);
  return Number.isFinite(own) && own > 0 ? own : getCrop(field?.crop).pricePerKg;
}

// Bir tarlanın içinde bulunduğu sezon için kâr özeti.
export function fieldProfit(field, allExpenses) {
  if (!field) return calculateProfit({});
  const seasonExpenses = expensesForFieldSeason(allExpenses, field.id, field.season);
  return calculateProfit({
    area: field.area,
    yieldPerDonum: fieldYield(field),
    pricePerKg: fieldPrice(field),
    totalExpense: sumExpenses(seasonExpenses),
  });
}

// "Ne ekelim?" karşılaştırması. priceOverrides: { [cropKey]: fiyat }
// Sonuç net kâra göre büyükten küçüğe sıralıdır.
export function compareCrops(area, priceOverrides = {}) {
  const a = Math.max(0, safeNumber(area));
  return CROPS.map((crop) => {
    const override = Number(priceOverrides[crop.key]);
    const price = Number.isFinite(override) && override > 0 ? override : crop.pricePerKg;
    const cost = a * crop.costPerDonum;
    const result = calculateProfit({
      area: a,
      yieldPerDonum: crop.yieldPerDonum,
      pricePerKg: price,
      totalExpense: cost,
    });
    return { key: crop.key, label: crop.label, ...result };
  }).sort((x, y) => y.netProfit - x.netProfit);
}

// Sezon kapatılırken saklanan özet. Gerçek hasat ve gerçek satış fiyatı
// kullanılır; bu yüzden karnede "gerçekleşen" olarak görünür.
export function buildSeasonSummary(field, allExpenses, { harvestKg, salePrice }) {
  const seasonExpenses = expensesForFieldSeason(allExpenses, field.id, field.season);
  const totalExpense = sumExpenses(seasonExpenses);
  const harvest = Math.max(0, safeNumber(harvestKg));
  const price = Math.max(0, safeNumber(salePrice));
  const area = Math.max(0, safeNumber(field.area));
  const revenue = round2(harvest * price);
  const netProfit = round2(revenue - totalExpense);
  return {
    season: String(field.season),
    crop: field.crop,
    cropLabel: getCrop(field.crop).label,
    area,
    totalExpense,
    harvestKg: harvest,
    yieldPerDonum: area > 0 ? round2(harvest / area) : 0,
    salePrice: price,
    revenue,
    netProfit,
    profitPerDonum: area > 0 ? round2(netProfit / area) : 0,
    isEstimate: false,
    closedAt: Date.now(),
  };
}

// Tarla Karnesi: kapatılmış sezonlar (gerçekleşen) + içinde bulunulan sezon
// (tahmini). En yeni sezon en üstte.
export function buildReportCard(field, allExpenses) {
  if (!field) return [];
  const past = Array.isArray(field.pastSeasons) ? field.pastSeasons : [];
  const current = fieldProfit(field, allExpenses);
  const currentRow = {
    season: String(field.season),
    crop: field.crop,
    cropLabel: getCrop(field.crop).label,
    area: current.area,
    totalExpense: current.totalExpense,
    harvestKg: current.estimatedHarvest,
    yieldPerDonum: current.yieldPerDonum,
    salePrice: current.pricePerKg,
    revenue: current.estimatedRevenue,
    netProfit: current.netProfit,
    profitPerDonum: current.profitPerDonum,
    isEstimate: true,
  };
  const pastRows = [...past].sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
  return [currentRow, ...pastRows];
}
