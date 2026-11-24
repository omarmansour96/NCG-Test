import { Brand, Category, Product, PricingTier } from '../types/catalog';

export const HERO_STOREFRONT_IMAGE = '/src/assets/images/hero_medical_storefront_1794919017760.jpg';
export const PRODUCT_A_IMAGE = '/src/assets/images/product_otoscope_kit_1794919018154.jpg';
export const PRODUCT_B_IMAGE = '/src/assets/images/product_hydrocolloid_dressings_1794919020170.jpg';
export const PRODUCT_C_IMAGE = '/src/assets/images/product_nitrile_gloves_1794919019793.jpg';

export const SEED_BRANDS: Brand[] = [
  {
    id: 'brand-sterishield',
    name: 'SteriShield Medical',
    slug: 'sterishield-medical',
    description: 'ISO 13485 certified manufacturer of sterile surgical barrier gloves and advanced wound care dressings.',
  },
  {
    id: 'brand-alkuwait-diagnostics',
    name: 'Al-Kuwait Diagnostics',
    slug: 'al-kuwait-diagnostics',
    description: 'Precision clinical examination and diagnostic instruments engineered for hospital and outpatient care.',
  },
];

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-surgical-wound',
    name: 'Surgical & Wound Care',
    slug: 'surgical-wound-care',
    description: 'Sterile examination gloves, hydrocolloid dressings, and clinical barrier protection consumables.',
  },
  {
    id: 'cat-diagnostic-instruments',
    name: 'Diagnostic Instruments',
    slug: 'diagnostic-instruments',
    description: 'Optical, acoustic, and electronic diagnostic devices for primary and specialist clinical assessment.',
  },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-a',
    name: 'Product A — Digital Fiber-Optic LED Otoscope Kit',
    sku: 'NCG-OTO-100',
    description:
      'Clinical fiber-optic diagnostic otoscope featuring a 3x scratch-resistant optical glass magnification lens, distal LED ring illumination, and reusable autoclavable specula set in a hard protective case.',
    imageUrl: PRODUCT_A_IMAGE,
    brandId: 'brand-alkuwait-diagnostics',
    categoryId: 'cat-diagnostic-instruments',
  },
  {
    id: 'prod-b',
    name: 'Product B — Advanced Hydrocolloid Sterile Wound Dressings',
    sku: 'NCG-HYD-200',
    description:
      'Sterile 10x10 cm waterproof hydrocolloid dressing pads (10 dressings per pack) that maintain an optimal moist wound healing environment while locking in exudate and protecting against external bacterial contamination.',
    imageUrl: PRODUCT_B_IMAGE,
    brandId: 'brand-sterishield',
    categoryId: 'cat-surgical-wound',
  },
  {
    id: 'prod-c',
    name: 'Product C — Surgical Nitrile Examination Gloves (Powder-Free)',
    sku: 'NCG-GLV-300',
    description:
      'Hospital-grade ASTM D6319 & EN 455 compliant powder-free nitrile examination gloves (100 gloves per dispenser pack) with micro-textured fingertips for precision instrument grip and high puncture resistance.',
    imageUrl: PRODUCT_C_IMAGE,
    brandId: 'brand-sterishield',
    categoryId: 'cat-surgical-wound',
  },
];

export const SEED_PRICING_TIERS: PricingTier[] = [
  // Product A: Exactly ONE pricing option (1 pack)
  {
    id: 'tier-a-1',
    productId: 'prod-a',
    label: '1 pack',
    unitsPerBundle: 1,
    bundlePrice: 12.5,
    sortOrder: 1,
  },
  // Product B: Exactly TWO pricing options (1 pack / 4 packs)
  {
    id: 'tier-b-1',
    productId: 'prod-b',
    label: '1 pack',
    unitsPerBundle: 1,
    bundlePrice: 8.75,
    sortOrder: 1,
  },
  {
    id: 'tier-b-2',
    productId: 'prod-b',
    label: '4 packs',
    unitsPerBundle: 4,
    bundlePrice: 31.0,
    sortOrder: 2,
  },
  // Product C: Exactly THREE pricing options (1 pack / 4 packs / 12 packs at 5.500, 19.500, 55.000 KWD)
  {
    id: 'tier-c-1',
    productId: 'prod-c',
    label: '1 pack',
    unitsPerBundle: 1,
    bundlePrice: 5.5,
    sortOrder: 1,
  },
  {
    id: 'tier-c-2',
    productId: 'prod-c',
    label: '4 packs',
    unitsPerBundle: 4,
    bundlePrice: 19.5,
    sortOrder: 2,
  },
  {
    id: 'tier-c-3',
    productId: 'prod-c',
    label: '12 packs',
    unitsPerBundle: 12,
    bundlePrice: 55.0,
    sortOrder: 3,
  },
];
