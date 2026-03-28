import type { ProductCategory } from "@/types";

/** Stable Unsplash-style URLs (no `sig`); used when DB URLs are missing or fail to load. */
const FALLBACK_BY_CATEGORY: Record<ProductCategory, string> = {
  "Food & Beverages":
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85",
  Textbooks:
    "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=85",
  Electronics:
    "https://images.unsplash.com/photo-1498049860654-af1a949c0577?auto=format&fit=crop&w=900&q=85",
  Clothing:
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=85",
  Stationery:
    "https://images.unsplash.com/photo-1455390582262-044c114ba85?auto=format&fit=crop&w=900&q=85",
  Accessories:
    "https://images.unsplash.com/photo-1523275339524-6635f54ca9d9?auto=format&fit=crop&w=900&q=85",
  "Home & Living":
    "https://images.unsplash.com/photo-1484100356142-db6ab6244067?auto=format&fit=crop&w=900&q=85",
  Other:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85",
};

const GENERIC_STOREFRONT =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85";

export function isLikelyImageUrl(u: string): boolean {
  const s = u.trim();
  if (!s) return false;
  if (s.startsWith("/")) return true;
  if (!s.startsWith("http://") && !s.startsWith("https://")) return false;
  try {
    const { hostname } = new URL(s);
    return hostname.length > 0;
  } catch {
    return false;
  }
}

/** First usable gallery URL from DB JSON / text array. */
export function pickFromProductImages(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  for (const item of images) {
    if (typeof item === "string" && isLikelyImageUrl(item)) return item.trim();
  }
  return null;
}

export function categoryFallbackImage(category: string): string {
  const cat = category as ProductCategory;
  return FALLBACK_BY_CATEGORY[cat] ?? FALLBACK_BY_CATEGORY.Other;
}

export function resolveProductCardImage(
  images: string[] | null | undefined,
  category: string
): string {
  return pickFromProductImages(images) ?? categoryFallbackImage(category);
}

export function resolveProductGallery(
  images: string[] | null | undefined,
  category: string
): string[] {
  const out: string[] = [];
  if (Array.isArray(images)) {
    for (const item of images) {
      if (typeof item === "string" && isLikelyImageUrl(item)) {
        const t = item.trim();
        if (!out.includes(t)) out.push(t);
      }
    }
  }
  if (out.length === 0) out.push(categoryFallbackImage(category));
  return out;
}

export const genericListingImage = () => GENERIC_STOREFRONT;
