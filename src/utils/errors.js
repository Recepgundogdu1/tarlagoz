// Firebase, ağ ve izin hatalarını kullanıcının anlayacağı Türkçe mesajlara çevirir.
// Tüm try/catch blokları hatayı buradan geçirerek gösterir.

const FIREBASE_MESSAGES = {
  'auth/invalid-email': 'E-posta adresi geçersiz.',
  'auth/user-disabled': 'Bu hesap kapatılmış.',
  'auth/user-not-found': 'Bu e-posta ile kayıtlı bir hesap bulunamadı.',
  'auth/wrong-password': 'Şifre hatalı.',
  'auth/invalid-credential': 'E-posta veya şifre hatalı.',
  'auth/invalid-login-credentials': 'E-posta veya şifre hatalı.',
  'auth/email-already-in-use': 'Bu e-posta adresiyle zaten bir hesap var.',
  'auth/weak-password': 'Şifre çok zayıf. En az 6 karakter kullanın.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.',
  'auth/network-request-failed': 'İnternet bağlantısı yok. Bağlantınızı kontrol edin.',
  'auth/operation-not-allowed': 'E-posta ile giriş Firebase panelinde açık değil.',
  'auth/invalid-api-key': 'Firebase ayarları eksik veya hatalı (.env dosyasını kontrol edin).',
  'permission-denied': 'Bu işlem için yetkiniz yok.',
  unavailable: 'Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.',
  'deadline-exceeded': 'İşlem zaman aşımına uğradı. Tekrar deneyin.',
  'not-found': 'Kayıt bulunamadı.',
  'resource-exhausted': 'Kullanım sınırı aşıldı. Daha sonra tekrar deneyin.',
  unauthenticated: 'Oturumunuz kapanmış. Tekrar giriş yapın.',
  'storage/unauthorized': 'Dosya yüklemek için yetkiniz yok.',
  'storage/canceled': 'Dosya yükleme iptal edildi.',
  'storage/quota-exceeded': 'Depolama kotası doldu.',
  'storage/retry-limit-exceeded': 'Dosya yüklenemedi. İnternet bağlantınızı kontrol edin.',
};

export const OFFLINE_MESSAGE = 'İnternet bağlantısı yok. Bağlantınızı kontrol edip tekrar deneyin.';
export const TIMEOUT_MESSAGE = 'İşlem çok uzun sürdü. İnternet bağlantınızı kontrol edip tekrar deneyin.';

export function getErrorMessage(error, fallback = 'Beklenmeyen bir hata oluştu. Tekrar deneyin.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;

  // Kendi fırlattığımız, zaten Türkçe olan hatalar.
  if (error.userMessage) return error.userMessage;

  const code = typeof error.code === 'string' ? error.code : '';
  if (FIREBASE_MESSAGES[code]) return FIREBASE_MESSAGES[code];

  // "firestore/permission-denied" gibi önekli kodlar.
  const shortCode = code.includes('/') ? code.split('/').pop() : code;
  if (FIREBASE_MESSAGES[shortCode]) return FIREBASE_MESSAGES[shortCode];

  // axios hataları
  if (code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) return TIMEOUT_MESSAGE;
  if (code === 'ERR_NETWORK' || /network/i.test(error.message || '')) return OFFLINE_MESSAGE;

  return fallback;
}

// Kullanıcıya gösterilecek mesajı taşıyan hata üretir.
export function userError(message) {
  const err = new Error(message);
  err.userMessage = message;
  return err;
}
