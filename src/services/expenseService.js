// Masrafların Firestore işlemleri ("expenses" koleksiyonu).

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'expenses';

// Kimliği telefonda üretiyoruz. Böylece çevrimdışı eklenen masraf sonradan
// gönderildiğinde aynı kimlikle yazılır ve iki kez gönderilse bile çift kayıt
// oluşmaz.
export function newExpenseId() {
  return doc(collection(db, COLLECTION)).id;
}

export async function saveExpense(expense) {
  const { id, pending, ...data } = expense; // "pending" yalnızca telefonda kullanılır
  await setDoc(doc(db, COLLECTION, id), data);
  return { id, ...data };
}

// Kullanıcının tüm masrafları. Güvenlik kuralları gereği sorguda ownerId
// filtresi bulunmak zorundadır.
export async function fetchExpenses(uid) {
  const q = query(collection(db, COLLECTION), where('ownerId', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function deleteExpense(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}
