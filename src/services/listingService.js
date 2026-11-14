// Satılık tarla ilanlarının Firestore işlemleri ("listings" koleksiyonu).

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { deleteImage, uploadImage } from './storageService';

const COLLECTION = 'listings';
export const MAX_LISTING_PHOTOS = 5;

// En yeni 200 ilan. İl, fiyat ve dönüm filtresi telefonda uygulanır; böylece
// Firestore'da bileşik dizin (composite index) tanımlamak gerekmez.
export async function fetchListings() {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(200));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// İlan oluşturur. Önce fotoğraflar Storage'a yüklenir, sonra ilan yazılır.
// reportCard (Tarla Karnesi) ilan anındaki kopyadır: alıcı, satıcının özel
// masraf kayıtlarına erişmeden karneyi görebilir.
export async function createListing(uid, data, photoUris = []) {
  const ref = doc(collection(db, COLLECTION));
  const photos = [];
  const photoPaths = [];

  const uris = photoUris.slice(0, MAX_LISTING_PHOTOS);
  for (let i = 0; i < uris.length; i += 1) {
    const path = `listings/${uid}/${ref.id}/${i}.jpg`;
    const url = await uploadImage(uris[i], path);
    photos.push(url);
    photoPaths.push(path);
  }

  const payload = {
    ownerId: uid,
    ownerName: data.ownerName || '',
    phone: data.phone,
    fieldId: data.fieldId,
    title: data.title,
    price: data.price,
    area: data.area,
    city: data.city,
    district: data.district,
    description: data.description || '',
    location: data.location || null,
    photos,
    photoPaths,
    reportCard: data.reportCard || [],
    createdAt: Date.now(),
  };
  await setDoc(ref, payload);
  return { id: ref.id, ...payload };
}

export async function deleteListing(listing) {
  await deleteDoc(doc(db, COLLECTION, listing.id));
  const paths = Array.isArray(listing.photoPaths) ? listing.photoPaths : [];
  await Promise.all(paths.map((p) => deleteImage(p)));
}
