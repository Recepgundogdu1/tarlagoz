// Sayı, para ve tarih biçimlendirme yardımcıları.
// Intl API'sine güvenmek yerine elle biçimlendiriyoruz; böylece her cihazda
// aynı sonucu (1.234,50) alırız.

// 1234567.5 -> "1.234.567,5" (decimals = 1)
export function formatNumber(value, decimals = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  const fixed = Math.abs(n).toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  // -0,4 yuvarlanınca "-0" görünmesin.
  const sign = n < 0 && Number(fixed) !== 0 ? '-' : '';
  return sign + withDots + (decPart ? ',' + decPart : '');
}

export function formatTL(value, decimals = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return formatNumber(n, decimals) + ' TL';
}

export function formatDonum(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  const decimals = Number.isInteger(n) ? 0 : 1;
  return formatNumber(n, decimals) + ' dönüm';
}

export function formatKg(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return formatNumber(n, 0) + ' kg';
}

// 0.87 -> "%87"
export function formatPercent(ratio) {
  const n = Number(ratio);
  if (!Number.isFinite(n)) return '-';
  return '%' + formatNumber(n * 100, 0);
}

// Kullanıcının yazdığı metni sayıya çevirir. Türkçe yazımı destekler:
// "4.500,50" -> 4500.5   "4500" -> 4500   "12,5" -> 12.5   "1.250" -> 1250
// Geçersiz girişte NaN döner.
export function parseNumber(text) {
  if (typeof text === 'number') return text;
  if (text === null || text === undefined) return NaN;
  let s = String(text).trim().replace(/\s/g, '').replace(/TL|₺/gi, '');
  if (s === '') return NaN;
  if (s.includes(',')) {
    // Virgül ondalık ayırıcıdır; noktalar binlik ayırıcıdır.
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.250" veya "12.500.000" gibi: noktalar binlik ayırıcı.
    s = s.replace(/\./g, '');
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return parseFloat(s);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Yerel saate göre bugünün tarihi: "2026-11-14"
// (toISOString UTC kullandığı için gece yarısına yakın saatlerde bir gün kayabilir.)
export function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// "2026-11-14" -> "14.11.2026"
export function isoToTR(iso) {
  if (typeof iso !== 'string') return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return `${m[3]}.${m[2]}.${m[1]}`;
}

// "14.11.2026" (veya 14/11/2026, 14-11-2026) -> "2026-11-14"
// Geçersiz tarihte (örn. 31.02.2026) null döner.
export function trToISO(text) {
  if (typeof text !== 'string') return null;
  const m = text.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(year, month - 1, day);
  const valid =
    d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  if (!valid) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

// Milisaniye zaman damgası -> "14.11.2026 15:30"
export function formatDateTime(ms) {
  const d = new Date(Number(ms));
  if (Number.isNaN(d.getTime())) return '';
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}`;
}

const DAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

// "2026-11-14" -> "Cmt"
export function dayNameShort(iso) {
  const m = typeof iso === 'string' ? iso.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  if (!m) return '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return DAY_NAMES[d.getDay()];
}

// Varsayılan sezon adı: içinde bulunulan yıl.
export function currentSeason() {
  return String(new Date().getFullYear());
}
