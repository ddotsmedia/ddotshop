export interface ShopVariant {
  name: string;
  values: string[];
}

export interface ShopProduct {
  id: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  price: number;
  comparePrice?: number | null;
  images: string[];
  stock: number;
  trackStock: boolean;
  isFeatured: boolean;
  categoryId?: string | null;
  variants: ShopVariant[];
  rating?: number;
  reviewCount?: number;
}

export interface ShopCategory {
  id: string;
  name: string;
}

export interface ShopInfo {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  logoUrl?: string | null;
  themeColor: string;
  currency: string;
  whatsappNumber: string;
  isVerified: boolean;
}
