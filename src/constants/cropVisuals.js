// Ürünlere özel renk ve ikon (kartlarda görsel ayırt ediciliği artırır).
// Listede olmayan ürün için varsayılan yeşil yaprak kullanılır.

const VISUALS = {
  bugday: { color: '#D9A93F', icon: 'sunny-outline' },
  arpa: { color: '#C9A15A', icon: 'sunny-outline' },
  misir: { color: '#E0B12E', icon: 'nutrition-outline' },
  pamuk: { color: '#8FA3B8', icon: 'cloud-outline' },
  aycicegi: { color: '#E8B21F', icon: 'flower-outline' },
  mercimek: { color: '#C8643B', icon: 'ellipse-outline' },
  nohut: { color: '#C99A5B', icon: 'ellipse-outline' },
  seker_pancari: { color: '#A2456B', icon: 'water-outline' },
  fistik: { color: '#7FA046', icon: 'leaf-outline' },
  zeytin: { color: '#6E7F3A', icon: 'leaf-outline' },
  uzum: { color: '#7B4A8E', icon: 'wine-outline' },
  findik: { color: '#9C6B3E', icon: 'leaf-outline' },
  domates: { color: '#D2453A', icon: 'nutrition-outline' },
  biber: { color: '#3F8F4A', icon: 'flame-outline' },
};

const DEFAULT = { color: '#2F7A3E', icon: 'leaf-outline' };

export function getCropVisual(key) {
  return VISUALS[key] || DEFAULT;
}
