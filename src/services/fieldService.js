// Tarlaların Firestore işlemleri ("fields" koleksiyonu).

import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'fields';

export async function fetchFields(uid) {
  const q = query(collection(db, COLLECTION), where('ownerId', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function createField(uid, data) {
  const payload = {
    ownerId: uid,
    name: data.name,
    crop: data.crop,
    area: data.area,
    season: data.season,
    location: data.location || null,
    polygon: data.polygon || [],
    expectedYield: data.expectedYield,
    expectedPrice: data.expectedPrice,
    pastSeasons: [],
    createdAt: Date.now(),
  };
  const ref = await addDoc(collection(db, COLLECTION), payload);
  return { id: ref.id, ...payload };
}

export async function updateField(id, patch) {
  await updateDoc(doc(db, COLLECTION, id), patch);
  return { id, ...patch };
}

// Tarlayı, ona bağlı masrafları ve teşhisleri birlikte siler.
// Firestore bir toplu işlemde (batch) en fazla 500 yazmaya izin verdiği için
// silmeler 400'lük parçalara bölünür.
export async function deleteFieldCascade(uid, fieldId) {
  const refs = [];
  const related = ['expenses', 'diagnoses'];
  for (let i = 0; i < related.length; i += 1) {
    const q = query(
      collection(db, related[i]),
      where('ownerId', '==', uid),
      where('fieldId', '==', fieldId)
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach((d) => refs.push(d.ref));
  }
  refs.push(doc(db, COLLECTION, fieldId));

  for (let start = 0; start < refs.length; start += 400) {
    const batch = writeBatch(db);
    refs.slice(start, start + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}
