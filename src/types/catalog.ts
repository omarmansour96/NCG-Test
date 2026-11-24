export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  imageUrl: string;
  brandId: string;
  categoryId: string;
}

export interface PricingTier {
  id: string;
  productId: string;
  label: string;
  unitsPerBundle: number;
  bundlePrice: number;
  sortOrder: number;
}

export interface CartItem {
  /** Composite key `${productId}::${tierId}` so different offers for the same product remain separate cart items */
  key: string;
  productId: string;
  productName: string;
  productSku: string;
  productImageUrl: string;
  brandName: string;
  categoryName: string;
  tierId: string;
  tierLabel: string;
  unitsPerBundle: number;
  bundlePrice: number;
  bundleQuantity: number;
}

export type ActivePage = 'home' | 'product-details' | 'cart' | 'admin';
