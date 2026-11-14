// Firebase Storage'a fotoğraf yükleme ve silme.

import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/config';

// Telefondaki bir fotoğrafı (file:// adresi) Storage'a yükler ve indirme
// adresini döner. path örneği: "listings/<uid>/<ilanId>/0.jpg"
export async function uploadImage(localUri, path) {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

// Silme başarısız olursa (dosya zaten yoksa) sessizce geçilir.
export async function deleteImage(path) {
  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    // yok sayılır
  }
}
