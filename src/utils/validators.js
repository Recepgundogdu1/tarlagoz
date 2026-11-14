// Form doğrulama. Her fonksiyon { valid, errors } döner; errors içinde alan
// adı -> Türkçe hata mesajı bulunur. Ekranlar bu mesajları ilgili girişin
// altında gösterir.

import { parseNumber, trToISO } from './format';
import { CATEGORY_KEYS } from '../constants/expenseCategories';
import { CROP_KEYS } from '../constants/crops';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function result(errors) {
  return { valid: Object.keys(errors).length === 0, errors };
}

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (isBlank(email)) errors.email = 'E-posta adresinizi yazın.';
  else if (!isValidEmail(email)) errors.email = 'Geçerli bir e-posta adresi yazın.';
  if (isBlank(password)) errors.password = 'Şifrenizi yazın.';
  return result(errors);
}

export function validateRegister({ name, email, password, passwordAgain }) {
  const errors = {};
  if (isBlank(name)) errors.name = 'Adınızı ve soyadınızı yazın.';
  else if (String(name).trim().length < 3) errors.name = 'Ad en az 3 harf olmalı.';
  if (isBlank(email)) errors.email = 'E-posta adresinizi yazın.';
  else if (!isValidEmail(email)) errors.email = 'Geçerli bir e-posta adresi yazın.';
  if (isBlank(password)) errors.password = 'Bir şifre belirleyin.';
  else if (String(password).length < 6) errors.password = 'Şifre en az 6 karakter olmalı.';
  if (password !== passwordAgain) errors.passwordAgain = 'Şifreler birbiriyle aynı değil.';
  return result(errors);
}

export function validateField({ name, crop, area, season, expectedYield, expectedPrice }) {
  const errors = {};
  if (isBlank(name)) errors.name = 'Tarlaya bir ad verin.';
  else if (String(name).trim().length > 60) errors.name = 'Tarla adı en fazla 60 karakter olabilir.';
  if (isBlank(crop) || !CROP_KEYS.includes(crop)) errors.crop = 'Bir ürün seçin.';

  const areaNum = parseNumber(area);
  if (isBlank(area)) errors.area = 'Dönümü yazın veya haritada çizin.';
  else if (!Number.isFinite(areaNum) || areaNum <= 0) errors.area = 'Dönüm sıfırdan büyük bir sayı olmalı.';
  else if (areaNum > 1000000) errors.area = 'Dönüm değeri çok büyük görünüyor.';

  if (isBlank(season)) errors.season = 'Sezonu yazın (örnek: 2026).';
  else if (String(season).trim().length > 20) errors.season = 'Sezon adı çok uzun.';

  if (!isBlank(expectedYield)) {
    const y = parseNumber(expectedYield);
    if (!Number.isFinite(y) || y <= 0) errors.expectedYield = 'Verim sıfırdan büyük bir sayı olmalı.';
  }
  if (!isBlank(expectedPrice)) {
    const p = parseNumber(expectedPrice);
    if (!Number.isFinite(p) || p <= 0) errors.expectedPrice = 'Fiyat sıfırdan büyük bir sayı olmalı.';
  }
  return result(errors);
}

export function validateExpense({ category, amount, dateText, note }) {
  const errors = {};
  if (isBlank(category) || !CATEGORY_KEYS.includes(category)) errors.category = 'Bir masraf kalemi seçin.';

  const amountNum = parseNumber(amount);
  if (isBlank(amount)) errors.amount = 'Tutarı yazın.';
  else if (!Number.isFinite(amountNum) || amountNum <= 0) errors.amount = 'Tutar sıfırdan büyük bir sayı olmalı.';
  else if (amountNum >= 100000000) errors.amount = 'Tutar çok büyük görünüyor.';

  if (isBlank(dateText)) errors.dateText = 'Tarihi yazın (GG.AA.YYYY).';
  else if (!trToISO(dateText)) errors.dateText = 'Tarih geçersiz. Örnek: 14.11.2026';

  if (!isBlank(note) && String(note).length > 200) errors.note = 'Not en fazla 200 karakter olabilir.';
  return result(errors);
}

export function validateEstimates({ expectedYield, expectedPrice }) {
  const errors = {};
  const y = parseNumber(expectedYield);
  const p = parseNumber(expectedPrice);
  if (!Number.isFinite(y) || y <= 0) errors.expectedYield = 'Verim sıfırdan büyük bir sayı olmalı.';
  if (!Number.isFinite(p) || p <= 0) errors.expectedPrice = 'Fiyat sıfırdan büyük bir sayı olmalı.';
  return result(errors);
}

export function validateCloseSeason({ harvestKg, salePrice, nextSeason, nextCrop }) {
  const errors = {};
  const h = parseNumber(harvestKg);
  const p = parseNumber(salePrice);
  if (isBlank(harvestKg)) errors.harvestKg = 'Toplam hasadı kg olarak yazın.';
  else if (!Number.isFinite(h) || h < 0) errors.harvestKg = 'Hasat geçerli bir sayı olmalı.';
  if (isBlank(salePrice)) errors.salePrice = 'Satış fiyatını yazın.';
  else if (!Number.isFinite(p) || p < 0) errors.salePrice = 'Fiyat geçerli bir sayı olmalı.';
  if (isBlank(nextSeason)) errors.nextSeason = 'Yeni sezonu yazın (örnek: 2027).';
  if (isBlank(nextCrop) || !CROP_KEYS.includes(nextCrop)) errors.nextCrop = 'Yeni sezonun ürününü seçin.';
  return result(errors);
}

export function validateListing({ fieldId, title, price, city, district, description, phone }) {
  const errors = {};
  if (isBlank(fieldId)) errors.fieldId = 'İlana konu tarlayı seçin.';
  if (isBlank(title)) errors.title = 'İlan başlığını yazın.';
  else if (String(title).trim().length > 120) errors.title = 'Başlık en fazla 120 karakter olabilir.';

  const priceNum = parseNumber(price);
  if (isBlank(price)) errors.price = 'Satış fiyatını yazın.';
  else if (!Number.isFinite(priceNum) || priceNum <= 0) errors.price = 'Fiyat sıfırdan büyük bir sayı olmalı.';

  if (isBlank(city)) errors.city = 'İl seçin.';
  if (isBlank(district)) errors.district = 'İlçeyi yazın.';
  if (!isBlank(description) && String(description).length > 1000) errors.description = 'Açıklama en fazla 1000 karakter olabilir.';

  const digits = String(phone || '').replace(/\D/g, '');
  if (isBlank(phone)) errors.phone = 'Alıcıların ulaşacağı telefon numarasını yazın.';
  else if (digits.length < 10 || digits.length > 13) errors.phone = 'Telefon numarası geçersiz görünüyor.';
  return result(errors);
}
