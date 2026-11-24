import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatKWD,
  calculateInternalPackQuantity,
  calculateLineTotal,
  addBundleToCart,
  updateCartBundleQuantity,
  removeCartLine,
  calculateCartSummary,
  validatePricingTierInput,
} from './pricing';
import { PricingTier, CartItem } from '../types/catalog';

const tier1Pack: PricingTier = {
  id: 'tier-c-1',
  productId: 'prod-c',
  label: '1 pack',
  unitsPerBundle: 1,
  bundlePrice: 5.5,
  sortOrder: 1,
};

const tier4Pack: PricingTier = {
  id: 'tier-c-2',
  productId: 'prod-c',
  label: '4 packs',
  unitsPerBundle: 4,
  bundlePrice: 19.5,
  sortOrder: 2,
};

const tier12Pack: PricingTier = {
  id: 'tier-c-3',
  productId: 'prod-c',
  label: '12 packs',
  unitsPerBundle: 12,
  bundlePrice: 55.0,
  sortOrder: 3,
};

test('formatKWD displays Kuwaiti dinars with three decimal places', () => {
  assert.equal(formatKWD(5.5), '5.500 KWD');
  assert.equal(formatKWD(19.5), '19.500 KWD');
  assert.equal(formatKWD(39), '39.000 KWD');
  assert.equal(formatKWD(55), '55.000 KWD');
});

test('Example from assessment brief: Two purchases of a 4-pack offer at 19.500 KWD', () => {
  // Customer sees in cart: 2 x 4-pack offer
  // Internal pack quantity: 8 packs
  // Line total: 39.000 KWD (uses selected bundle price 19.500 * 2, NOT 8 * 19.500)
  const internalPacks = calculateInternalPackQuantity(tier4Pack.unitsPerBundle, 2);
  const lineTotal = calculateLineTotal(tier4Pack.bundlePrice, 2);

  assert.equal(internalPacks, 8);
  assert.equal(lineTotal, 39.0);
  assert.equal(formatKWD(lineTotal), '39.000 KWD');
});

test('Different pricing tiers for the same product are kept as separate cart items', () => {
  let cart: CartItem[] = [];

  // Add 2 bundles of 4-pack offer for Product C
  cart = addBundleToCart(cart, {
    productId: 'prod-c',
    productName: 'Product C — Surgical Nitrile Examination Gloves',
    productSku: 'NCG-GLV-300',
    productImageUrl: '/images/product-c.svg',
    brandName: 'SteriShield Medical',
    categoryName: 'Surgical & Wound Care',
    tier: tier4Pack,
    bundleQuantity: 2,
  });

  // Add 1 bundle of 12-pack offer for the SAME Product C
  cart = addBundleToCart(cart, {
    productId: 'prod-c',
    productName: 'Product C — Surgical Nitrile Examination Gloves',
    productSku: 'NCG-GLV-300',
    productImageUrl: '/images/product-c.svg',
    brandName: 'SteriShield Medical',
    categoryName: 'Surgical & Wound Care',
    tier: tier12Pack,
    bundleQuantity: 1,
  });

  // Must be 2 separate cart items
  assert.equal(cart.length, 2);
  assert.equal(cart[0].tierId, 'tier-c-2');
  assert.equal(cart[0].bundleQuantity, 2);
  assert.equal(cart[1].tierId, 'tier-c-3');
  assert.equal(cart[1].bundleQuantity, 1);

  // Summary calculation:
  // Line 1: 2 bundles * 4 packs = 8 packs, 2 * 19.500 = 39.000 KWD
  // Line 2: 1 bundle * 12 packs = 12 packs, 1 * 55.000 = 55.000 KWD
  // Total: 3 bundles, 20 internal packs, 94.000 KWD
  const summary = calculateCartSummary(cart);
  assert.equal(summary.totalDistinctOffers, 2);
  assert.equal(summary.totalBundles, 3);
  assert.equal(summary.totalInternalPacks, 20);
  assert.equal(summary.subtotalKWD, 94.0);
});

test('Adding the same pricing tier for the same product increments bundle quantity', () => {
  let cart: CartItem[] = [];
  cart = addBundleToCart(cart, {
    productId: 'prod-c',
    productName: 'Product C',
    productSku: 'NCG-GLV-300',
    productImageUrl: '/images/product-c.svg',
    brandName: 'SteriShield',
    categoryName: 'Surgical',
    tier: tier1Pack,
    bundleQuantity: 1,
  });
  cart = addBundleToCart(cart, {
    productId: 'prod-c',
    productName: 'Product C',
    productSku: 'NCG-GLV-300',
    productImageUrl: '/images/product-c.svg',
    brandName: 'SteriShield',
    categoryName: 'Surgical',
    tier: tier1Pack,
    bundleQuantity: 3,
  });

  assert.equal(cart.length, 1);
  assert.equal(cart[0].bundleQuantity, 4);
  assert.equal(calculateLineTotal(cart[0].bundlePrice, cart[0].bundleQuantity), 22.0);
});

test('Updating and removing cart items recalculates totals and prevents invalid quantities', () => {
  let cart: CartItem[] = [];
  cart = addBundleToCart(cart, {
    productId: 'prod-c',
    productName: 'Product C',
    productSku: 'NCG-GLV-300',
    productImageUrl: '/images/product-c.svg',
    brandName: 'SteriShield',
    categoryName: 'Surgical',
    tier: tier4Pack,
    bundleQuantity: 2,
  });

  // Attempt invalid quantity update (0 or negative) -> ignored
  cart = updateCartBundleQuantity(cart, 'prod-c::tier-c-2', 0);
  assert.equal(cart[0].bundleQuantity, 2);

  // Valid update to 3 bundles -> 3 * 19.500 = 58.500 KWD
  cart = updateCartBundleQuantity(cart, 'prod-c::tier-c-2', 3);
  assert.equal(cart[0].bundleQuantity, 3);
  assert.equal(calculateCartSummary(cart).subtotalKWD, 58.5);

  // Remove line
  cart = removeCartLine(cart, 'prod-c::tier-c-2');
  assert.equal(cart.length, 0);
  assert.equal(calculateCartSummary(cart).subtotalKWD, 0);
});

test('validatePricingTierInput validates positive quantities and prices', () => {
  assert.equal(validatePricingTierInput({ label: '4 packs', unitsPerBundle: 4, bundlePrice: 19.5 }).valid, true);
  assert.equal(validatePricingTierInput({ label: '', unitsPerBundle: 4, bundlePrice: 19.5 }).valid, false);
  assert.equal(validatePricingTierInput({ label: '0 packs', unitsPerBundle: 0, bundlePrice: 19.5 }).valid, false);
  assert.equal(validatePricingTierInput({ label: '4 packs', unitsPerBundle: 4, bundlePrice: 0 }).valid, false);
  assert.equal(validatePricingTierInput({ label: '4 packs', unitsPerBundle: 4, bundlePrice: -5 }).valid, false);
});
