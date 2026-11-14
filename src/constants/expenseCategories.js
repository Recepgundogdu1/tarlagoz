// Masraf kalemleri. "key" Firestore'a yazılan değerdir; değiştirirseniz
// firestore.rules içindeki kategori listesini de güncelleyin.

export const EXPENSE_CATEGORIES = [
  { key: 'tohum', label: 'Tohum', icon: 'leaf-outline' },
  { key: 'gubre', label: 'Gübre', icon: 'flask-outline' },
  { key: 'ilac', label: 'İlaç', icon: 'medkit-outline' },
  { key: 'mazot', label: 'Mazot', icon: 'car-outline' },
  { key: 'sulama', label: 'Sulama Elektriği', icon: 'water-outline' },
  { key: 'iscilik', label: 'İşçilik', icon: 'people-outline' },
  { key: 'kira', label: 'Kira', icon: 'home-outline' },
  { key: 'diger', label: 'Diğer', icon: 'ellipsis-horizontal-circle-outline' },
];

export const CATEGORY_KEYS = EXPENSE_CATEGORIES.map((c) => c.key);

export function getCategory(key) {
  return (
    EXPENSE_CATEGORIES.find((c) => c.key === key) ||
    EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
  );
}
