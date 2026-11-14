// Çevrimdışı destek.
//
// 1) Masraf kuyruğu: İnternet yokken eklenen masraflar AsyncStorage'da
//    bekletilir, bağlantı gelince Firestore'a gönderilir.
// 2) Önbellek: En son indirilen tarla ve masraf listesi saklanır; internet
//    yokken uygulama bu kopyayı gösterir.
//
// Not: Firebase JS SDK çevrimdışıyken yazma isteğini reddetmez, süresiz
// bekletir. Bu yüzden bağlantıyı kendimiz yokluyor ve yazmalara süre sınırı
// koyuyoruz.

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { TIMEOUT_MESSAGE, userError } from '../utils/errors';

const QUEUE_KEY = 'tarlagoz:expenseQueue:v1';
const CACHE_PREFIX = 'tarlagoz:cache:v1:';

// Küçük ve hızlı yanıt veren iki adres. Biri engelliyse diğeri denenir.
const PROBE_URLS = [
  'https://clients3.google.com/generate_204',
  'https://api.open-meteo.com/v1/forecast?latitude=39&longitude=35&current=temperature_2m',
];

// İnternet var mı? Gerçek bir istek atarak kontrol eder.
export async function isOnline() {
  for (let i = 0; i < PROBE_URLS.length; i += 1) {
    try {
      await axios.get(PROBE_URLS[i], {
        timeout: 4000,
        validateStatus: () => true, // herhangi bir HTTP yanıtı "bağlantı var" demektir
      });
      return true;
    } catch (error) {
      // sıradaki adresi dene
    }
  }
  return false;
}

// Bir işleme süre sınırı koyar; süre dolarsa Türkçe mesajlı hata fırlatır.
export function withTimeout(promise, ms = 10000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(userError(TIMEOUT_MESSAGE)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ---------- Masraf kuyruğu ----------

export async function getQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function saveQueue(queue) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// Kuyruğa masraf ekler. Aynı kimlikli kayıt varsa üzerine yazar (çift kayıt olmaz).
export async function enqueueExpense(expense) {
  const queue = await getQueue();
  const filtered = queue.filter((item) => item.id !== expense.id);
  filtered.push(expense);
  await saveQueue(filtered);
  return filtered.length;
}

export async function removeFromQueue(ids) {
  const idSet = new Set(ids);
  const queue = await getQueue();
  const remaining = queue.filter((item) => !idSet.has(item.id));
  await saveQueue(remaining);
  return remaining.length;
}

// Yalnızca bu kullanıcıya ait bekleyen masraflar (telefonu başkası da kullanmış olabilir).
export async function getQueueForUser(uid) {
  const queue = await getQueue();
  return queue.filter((item) => item.ownerId === uid);
}

// ---------- Önbellek ----------

export async function saveCache(name, uid, data) {
  try {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${name}:${uid}`, JSON.stringify(data));
  } catch (error) {
    // Önbelleğe yazılamaması uygulamayı durdurmamalı.
  }
}

export async function loadCache(name, uid) {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${name}:${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}
