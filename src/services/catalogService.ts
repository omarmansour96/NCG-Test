import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Brand, Category, Product, PricingTier } from '../types/catalog';
import {
  SEED_BRANDS,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_PRICING_TIERS,
} from '../data/seedCatalog';

let isSeeding = false;

/**
 * Ensures the initial assessment catalog exists in Firestore if the database is empty.
 * Runs idempotently on first boot.
 */
export async function ensureInitialCatalogSeeded(): Promise<void> {
  if (isSeeding) return;
  isSeeding = true;
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    if (!productsSnap.empty) {
      // Automatically upgrade legacy SVG placeholder paths on prod-a, prod-b, prod-c to studio photos
      const upgradeBatch = writeBatch(db);
      let needsUpgrade = false;
      productsSnap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const seedMatch = SEED_PRODUCTS.find((sp) => sp.id === docSnap.id);
        if (seedMatch && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('/images/product-')) {
          upgradeBatch.set(doc(db, 'products', docSnap.id), {
            ...data,
            imageUrl: seedMatch.imageUrl,
          });
          needsUpgrade = true;
        }
      });
      if (needsUpgrade) {
        await upgradeBatch.commit();
      }
      return;
    }
    await resetToDefaultAssessmentCatalog();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'products');
  } finally {
    isSeeding = false;
  }
}

/**
 * Resets or seeds the Firestore database with the exact assessment benchmark data:
 * - 2 Brands, 2 Categories
 * - Product A (1 option: 1 pack)
 * - Product B (2 options: 1 pack / 4 packs)
 * - Product C (3 options: 1 pack / 4 packs / 12 packs at 5.500, 19.500, 55.000 KWD)
 */
export async function resetToDefaultAssessmentCatalog(): Promise<void> {
  try {
    // 1. Delete existing pricingTiers, products, brands, categories first
    const [tiersSnap, prodsSnap, brandsSnap, catsSnap] = await Promise.all([
      getDocs(collection(db, 'pricingTiers')),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'brands')),
      getDocs(collection(db, 'categories')),
    ]);

    const deleteBatch = writeBatch(db);
    tiersSnap.docs.forEach((d) => deleteBatch.delete(d.ref));
    prodsSnap.docs.forEach((d) => deleteBatch.delete(d.ref));
    brandsSnap.docs.forEach((d) => deleteBatch.delete(d.ref));
    catsSnap.docs.forEach((d) => deleteBatch.delete(d.ref));
    await deleteBatch.commit();

    // 2. Write brands and categories first so Master Gate exists() rules pass for products
    const rootBatch = writeBatch(db);
    for (const brand of SEED_BRANDS) {
      rootBatch.set(doc(db, 'brands', brand.id), {
        name: brand.name.slice(0, 100),
        slug: brand.slug.slice(0, 100),
        description: brand.description.slice(0, 500),
      });
    }
    for (const category of SEED_CATEGORIES) {
      rootBatch.set(doc(db, 'categories', category.id), {
        name: category.name.slice(0, 100),
        slug: category.slug.slice(0, 100),
        description: category.description.slice(0, 500),
      });
    }
    await rootBatch.commit();

    // 3. Write products so Master Gate exists() rules pass for pricingTiers
    const prodBatch = writeBatch(db);
    for (const product of SEED_PRODUCTS) {
      prodBatch.set(doc(db, 'products', product.id), {
        name: product.name.slice(0, 160),
        sku: product.sku.slice(0, 64),
        description: product.description.slice(0, 2000),
        imageUrl: product.imageUrl.slice(0, 1000),
        brandId: product.brandId,
        categoryId: product.categoryId,
      });
    }
    await prodBatch.commit();

    // 4. Write pricingTiers
    const tierBatch = writeBatch(db);
    for (const tier of SEED_PRICING_TIERS) {
      tierBatch.set(doc(db, 'pricingTiers', tier.id), {
        productId: tier.productId,
        label: tier.label.slice(0, 100),
        unitsPerBundle: Math.max(1, Math.floor(tier.unitsPerBundle)),
        bundlePrice: Number(tier.bundlePrice.toFixed(3)),
        sortOrder: Math.max(0, Math.floor(tier.sortOrder)),
      });
    }
    await tierBatch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'catalog-seed');
  }
}

export async function saveBrandToFirestore(brand: Brand): Promise<void> {
  const path = `brands/${brand.id}`;
  try {
    await setDoc(doc(db, 'brands', brand.id), {
      name: brand.name.trim().slice(0, 100),
      slug: brand.slug.trim().slice(0, 100),
      description: brand.description.trim().slice(0, 500),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBrandFromFirestore(brandId: string): Promise<void> {
  const path = `brands/${brandId}`;
  try {
    await deleteDoc(doc(db, 'brands', brandId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCategoryToFirestore(category: Category): Promise<void> {
  const path = `categories/${category.id}`;
  try {
    await setDoc(doc(db, 'categories', category.id), {
      name: category.name.trim().slice(0, 100),
      slug: category.slug.trim().slice(0, 100),
      description: category.description.trim().slice(0, 500),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
  const path = `categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveProductWithTiersToFirestore(
  product: Product,
  tiers: PricingTier[],
  removedTierIds: string[] = []
): Promise<void> {
  const prodPath = `products/${product.id}`;
  try {
    await setDoc(doc(db, 'products', product.id), {
      name: product.name.trim().slice(0, 160),
      sku: product.sku.trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64),
      description: product.description.trim().slice(0, 2000),
      imageUrl: product.imageUrl.trim().slice(0, 1000),
      brandId: product.brandId,
      categoryId: product.categoryId,
    });

    const batch = writeBatch(db);
    for (const removedId of removedTierIds) {
      batch.delete(doc(db, 'pricingTiers', removedId));
    }
    tiers.forEach((tier, idx) => {
      batch.set(doc(db, 'pricingTiers', tier.id), {
        productId: product.id,
        label: tier.label.trim().slice(0, 100),
        unitsPerBundle: Math.max(1, Math.floor(Number(tier.unitsPerBundle))),
        bundlePrice: Number(Number(tier.bundlePrice).toFixed(3)),
        sortOrder: idx + 1,
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, prodPath);
  }
}

export async function deleteProductWithTiersFromFirestore(
  productId: string,
  tierIds: string[]
): Promise<void> {
  const prodPath = `products/${productId}`;
  try {
    const batch = writeBatch(db);
    for (const tierId of tierIds) {
      batch.delete(doc(db, 'pricingTiers', tierId));
    }
    batch.delete(doc(db, 'products', productId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, prodPath);
  }
}
