import { CartItem, PricingTier } from '../types/catalog';

/**
 * Formats a numeric price in Kuwaiti Dinars (KWD) with strictly three decimal places.
 * Example: 19.5 -> "19.500 KWD"
 */
export function formatKWD(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${safeAmount.toFixed(3)} KWD`;
}

/**
 * Formats only the 3-decimal numeric string (e.g., "19.500").
 */
export function formatKWDValue(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return safeAmount.toFixed(3);
}

/**
 * Generates a unique composite key for a cart line based on productId and tierId.
 * Ensures different pricing tiers (offers) for the same product are kept separate in the cart.
 */
export function getCartLineKey(productId: string, tierId: string): string {
  return `${productId}::${tierId}`;
}

/**
 * Calculates the internal pack quantity for a given bundle offer and bundle quantity.
 * Example: 2 purchases of a 4-pack offer -> 2 * 4 = 8 packs.
 */
export function calculateInternalPackQuantity(unitsPerBundle: number, bundleQuantity: number): number {
  const validUnits = Math.max(1, Math.floor(unitsPerBundle));
  const validBundles = Math.max(0, Math.floor(bundleQuantity));
  return validUnits * validBundles;
}

/**
 * Calculates the line total using strictly the selected bundle price multiplied by bundle quantity.
 * Never treats bundlePrice as a per-pack price.
 * Example: 2 purchases of a 4-pack offer at 19.500 KWD per bundle -> 2 * 19.500 = 39.000 KWD.
 */
export function calculateLineTotal(bundlePrice: number, bundleQuantity: number): number {
  const validPrice = Math.max(0, bundlePrice);
  const validBundles = Math.max(0, Math.floor(bundleQuantity));
  return Number((validPrice * validBundles).toFixed(3));
}

/**
 * Calculates the effective per-unit (per-pack) cost for display comparison only.
 */
export function calculateEffectiveUnitPrice(bundlePrice: number, unitsPerBundle: number): number {
  if (unitsPerBundle <= 0) return 0;
  return Number((bundlePrice / unitsPerBundle).toFixed(3));
}

/**
 * Adds or increments a selected pricing tier (bundle offer) in the cart.
 * - Keeps different pricing tiers for the same product as separate cart items.
 * - Rejects invalid or non-positive bundle quantities.
 */
export function addBundleToCart(
  cart: CartItem[],
  item: {
    productId: string;
    productName: string;
    productSku: string;
    productImageUrl: string;
    brandName: string;
    categoryName: string;
    tier: PricingTier;
    bundleQuantity: number;
  }
): CartItem[] {
  const qty = Math.floor(item.bundleQuantity);
  if (!Number.isFinite(qty) || qty < 1) {
    throw new Error('Bundle quantity must be a positive integer of at least 1.');
  }

  const key = getCartLineKey(item.productId, item.tier.id);
  const existingIndex = cart.findIndex((line) => line.key === key);

  if (existingIndex > -1) {
    return cart.map((line, index) =>
      index === existingIndex
        ? {
            ...line,
            bundleQuantity: Math.min(999, line.bundleQuantity + qty),
            bundlePrice: item.tier.bundlePrice,
            unitsPerBundle: item.tier.unitsPerBundle,
            tierLabel: item.tier.label,
          }
        : line
    );
  }

  const newLine: CartItem = {
    key,
    productId: item.productId,
    productName: item.productName,
    productSku: item.productSku,
    productImageUrl: item.productImageUrl,
    brandName: item.brandName,
    categoryName: item.categoryName,
    tierId: item.tier.id,
    tierLabel: item.tier.label,
    unitsPerBundle: item.tier.unitsPerBundle,
    bundlePrice: item.tier.bundlePrice,
    bundleQuantity: Math.min(999, qty),
  };

  return [...cart, newLine];
}

/**
 * Updates the bundle quantity of a specific cart line (`productId::tierId`).
 * Prevents invalid (< 1) quantities.
 */
export function updateCartBundleQuantity(
  cart: CartItem[],
  key: string,
  newBundleQuantity: number
): CartItem[] {
  const qty = Math.floor(newBundleQuantity);
  if (!Number.isFinite(qty) || qty < 1) {
    return cart;
  }
  const clamped = Math.min(999, qty);
  return cart.map((line) => (line.key === key ? { ...line, bundleQuantity: clamped } : line));
}

/**
 * Removes a specific cart line (`productId::tierId`) from the cart.
 */
export function removeCartLine(cart: CartItem[], key: string): CartItem[] {
  return cart.filter((line) => line.key !== key);
}

/**
 * Calculates aggregate cart summary metrics:
 * - totalDistinctOffers: number of separate line items
 * - totalBundles: sum of bundleQuantity across all lines
 * - totalInternalPacks: sum of derived pack quantities across all lines
 * - subtotalKWD: exact sum of line totals in KWD
 */
export function calculateCartSummary(cart: CartItem[]): {
  totalDistinctOffers: number;
  totalBundles: number;
  totalInternalPacks: number;
  subtotalKWD: number;
} {
  let totalBundles = 0;
  let totalInternalPacks = 0;
  let subtotal = 0;

  for (const line of cart) {
    totalBundles += line.bundleQuantity;
    totalInternalPacks += calculateInternalPackQuantity(line.unitsPerBundle, line.bundleQuantity);
    subtotal += calculateLineTotal(line.bundlePrice, line.bundleQuantity);
  }

  return {
    totalDistinctOffers: cart.length,
    totalBundles,
    totalInternalPacks,
    subtotalKWD: Number(subtotal.toFixed(3)),
  };
}

/**
 * Validates admin input for creating/editing a PricingTier.
 */
export function validatePricingTierInput(input: {
  label: string;
  unitsPerBundle: number;
  bundlePrice: number;
}): { valid: boolean; error?: string } {
  const trimmedLabel = input.label.trim();
  if (!trimmedLabel || trimmedLabel.length > 100) {
    return { valid: false, error: 'Offer label is required (1–100 characters).' };
  }
  if (!Number.isInteger(input.unitsPerBundle) || input.unitsPerBundle < 1 || input.unitsPerBundle > 10000) {
    return { valid: false, error: 'Units per bundle must be a positive whole number (1–10,000).' };
  }
  if (!Number.isFinite(input.bundlePrice) || input.bundlePrice <= 0 || input.bundlePrice > 1000000) {
    return { valid: false, error: 'Bundle price must be a positive KWD amount greater than 0.000.' };
  }
  return { valid: true };
}

/**
 * Converts a display name into a valid URL/ID slug matching `^[a-zA-Z0-9_\-]+$`.
 */
export function toValidSlug(input: string): string {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
  return cleaned || `item-${Date.now()}`;
}
