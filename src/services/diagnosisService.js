// Hastalık teşhislerinin Firestore işlemleri ("diagnoses" koleksiyonu).

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
import { deleteImage, uploadImage } from './storageService';

const COLLECTION = 'diagnoses';

// Teşhisi kaydeder. Fotoğraf yüklenemezse (zayıf internet) teşhis yine de
// fotoğrafsız olarak saklanır; sonuç kaybolmaz.
export async function saveDiagnosis(uid, { fieldId, fieldName, result, photoUri }) {
  const ref = doc(collection(db, COLLECTION));
  let imageUrl = null;
  let imagePath = null;

  if (photoUri) {
    try {
      imagePath = `diagnoses/${uid}/${ref.id}.jpg`;
      imageUrl = await uploadImage(photoUri, imagePath);
    } catch (error) {
      imageUrl = null;
      imagePath = null;
    }
  }

  const payload = {
    ownerId: uid,
    fieldId,
    fieldName: fieldName || '',
    disease: result.disease,
    confidence: result.confidence,
    advice: result.advice,
    healthy: Boolean(result.healthy),
    demo: Boolean(result.demo),
    imageUrl,
    imagePath,
    createdAt: Date.now(),
  };
  await setDoc(ref, payload);
  return { id: ref.id, ...payload };
}

export async function fetchDiagnoses(uid) {
  const q = query(collection(db, COLLECTION), where('ownerId', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function deleteDiagnosis(diagnosis) {
  await deleteDoc(doc(db, COLLECTION, diagnosis.id));
  if (diagnosis.imagePath) await deleteImage(diagnosis.imagePath);
}
