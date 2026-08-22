export interface GalleryImageItem {
  id: string;
  url: string;
  prompt: string;
  createdAt: number;
  model: string;
  aspectRatio?: string;
}

const GALLERY_STORAGE_KEY = 'iportal_user_gallery_images';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function getGalleryImages(): GalleryImageItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: GalleryImageItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    // Auto purge images older than 30 days
    const valid = parsed.filter(item => now - item.createdAt < THIRTY_DAYS_MS);

    if (valid.length !== parsed.length) {
      saveGalleryImages(valid);
    }
    return valid;
  } catch {
    return [];
  }
}

export function saveGalleryImages(images: GalleryImageItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(images));
  } catch (e) {
    console.error('Failed to save gallery images:', e);
  }
}

export function addImageToGallery(prompt: string, url: string, model = 'Flux 8K', aspectRatio = '1:1'): GalleryImageItem {
  const images = getGalleryImages();
  const newItem: GalleryImageItem = {
    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    url,
    prompt,
    createdAt: Date.now(),
    model,
    aspectRatio,
  };
  const updated = [newItem, ...images];
  saveGalleryImages(updated);
  return newItem;
}

export function deleteGalleryImage(id: string): void {
  const images = getGalleryImages();
  const filtered = images.filter(img => img.id !== id);
  saveGalleryImages(filtered);
}
