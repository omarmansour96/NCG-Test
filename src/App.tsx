import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { ActivePage, Brand, CartItem, Category, PricingTier, Product } from './types/catalog';
import { ensureInitialCatalogSeeded } from './services/catalogService';
import {
  addBundleToCart,
  calculateCartSummary,
  formatKWD,
  removeCartLine,
  updateCartBundleQuantity,
} from './utils/pricing';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TopBar } from './components/TopBar';
import { HomeView } from './components/HomeView';
import { ProductDetailView } from './components/ProductDetailView';
import { CartView } from './components/CartView';
import { AdminView } from './components/AdminView';

const CART_STORAGE_KEY = 'ncg_medical_cart_v1';

export function AppContent() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>('prod-c');

  // Firestore Real-Time State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [runtimeError, setRuntimeError] = useState<Error | null>(null);

  // Shopping Cart State (persisted across refreshes, synced with live catalog tiers)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore local storage parse errors
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  // Seed initial catalog if empty & attach real-time Firestore listeners
  useEffect(() => {
    let isMounted = true;

    ensureInitialCatalogSeeded().catch((err) => {
      if (isMounted) setRuntimeError(err instanceof Error ? err : new Error(String(err)));
    });

    const unsubBrands = onSnapshot(
      collection(db, 'brands'),
      (snap) => {
        if (!isMounted) return;
        const list: Brand[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Brand, 'id'>),
        }));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setBrands(list);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'brands');
        } catch (wrapped) {
          if (isMounted) setRuntimeError(wrapped as Error);
        }
      }
    );

    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snap) => {
        if (!isMounted) return;
        const list: Category[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Category, 'id'>),
        }));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setCategories(list);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'categories');
        } catch (wrapped) {
          if (isMounted) setRuntimeError(wrapped as Error);
        }
      }
    );

    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        if (!isMounted) return;
        const list: Product[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Product, 'id'>),
        }));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setProducts(list);
        setIsLoading(false);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'products');
        } catch (wrapped) {
          if (isMounted) setRuntimeError(wrapped as Error);
        }
      }
    );

    const unsubTiers = onSnapshot(
      collection(db, 'pricingTiers'),
      (snap) => {
        if (!isMounted) return;
        const list: PricingTier[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PricingTier, 'id'>),
        }));
        setPricingTiers(list);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'pricingTiers');
        } catch (wrapped) {
          if (isMounted) setRuntimeError(wrapped as Error);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubBrands();
      unsubCategories();
      unsubProducts();
      unsubTiers();
    };
  }, []);

  // Sync cart items with latest product/tier updates from admin
  useEffect(() => {
    if (products.length === 0 || pricingTiers.length === 0) return;
    setCart((prevCart) => {
      if (prevCart.length === 0) return prevCart;
      let changed = false;
      const updated = prevCart
        .map((line) => {
          const prod = products.find((p) => p.id === line.productId);
          const tier = pricingTiers.find((t) => t.id === line.tierId);
          if (!prod || !tier) {
            changed = true;
            return null;
          }
          const brandName = brands.find((b) => b.id === prod.brandId)?.name || line.brandName;
          const categoryName = categories.find((c) => c.id === prod.categoryId)?.name || line.categoryName;
          if (
            line.productName !== prod.name ||
            line.productImageUrl !== prod.imageUrl ||
            line.tierLabel !== tier.label ||
            line.unitsPerBundle !== tier.unitsPerBundle ||
            line.bundlePrice !== tier.bundlePrice ||
            line.brandName !== brandName ||
            line.categoryName !== categoryName
          ) {
            changed = true;
            return {
              ...line,
              productName: prod.name,
              productSku: prod.sku,
              productImageUrl: prod.imageUrl,
              brandName,
              categoryName,
              tierLabel: tier.label,
              unitsPerBundle: tier.unitsPerBundle,
              bundlePrice: tier.bundlePrice,
            };
          }
          return line;
        })
        .filter((item): item is CartItem => item !== null);
      return changed ? updated : prevCart;
    });
  }, [products, pricingTiers, brands, categories]);

  if (runtimeError) {
    throw runtimeError;
  }

  const handleOpenProductDetails = (productId: string) => {
    setSelectedProductId(productId);
    setActivePage('product-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: Product, tier: PricingTier, bundleQuantity: number) => {
    const brandName = brands.find((b) => b.id === product.brandId)?.name || 'Unassigned Brand';
    const categoryName = categories.find((c) => c.id === product.categoryId)?.name || 'Unassigned Category';
    setCart((prev) =>
      addBundleToCart(prev, {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productImageUrl: product.imageUrl,
        brandName,
        categoryName,
        tier,
        bundleQuantity,
      })
    );
  };

  const handleUpdateCartQuantity = (key: string, newBundleQuantity: number) => {
    setCart((prev) => updateCartBundleQuantity(prev, key, newBundleQuantity));
  };

  const handleRemoveCartItem = (key: string) => {
    setCart((prev) => removeCartLine(prev, key));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const cartSummary = calculateCartSummary(cart);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        totalCartBundles={cartSummary.totalBundles}
        totalCartKWD={formatKWD(cartSummary.subtotalKWD)}
      />

      <main className="flex-1">
        {isLoading ? (
          <div className="max-w-[1360px] mx-auto px-6 py-16 text-center">
            <div className="inline-block w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-sm font-semibold text-slate-700">
              Loading Medical Catalog from Firebase Firestore...
            </h2>
          </div>
        ) : (
          <>
            {activePage === 'home' && (
              <HomeView
                products={products}
                brands={brands}
                categories={categories}
                pricingTiers={pricingTiers}
                onSelectProduct={handleOpenProductDetails}
                onAddToCart={handleAddToCart}
                onOpenAdmin={() => {
                  setActivePage('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {activePage === 'product-details' && (
              <ProductDetailView
                products={products}
                selectedProductId={selectedProductId}
                brands={brands}
                categories={categories}
                pricingTiers={pricingTiers}
                onSelectProduct={(pid) => setSelectedProductId(pid)}
                onBackToCatalog={() => setActivePage('home')}
                onAddToCart={handleAddToCart}
                onGoToCart={() => setActivePage('cart')}
                onOpenAdmin={() => {
                  setActivePage('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {activePage === 'cart' && (
              <CartView
                cart={cart}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onContinueShopping={() => setActivePage('home')}
                onOpenProductDetails={handleOpenProductDetails}
              />
            )}

            {activePage === 'admin' && (
              <AdminView
                products={products}
                brands={brands}
                categories={categories}
                pricingTiers={pricingTiers}
                onBackToStorefront={() => {
                  setActivePage('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-[1360px] mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            National Care Group · مجموعة العناية الوطنية · Medical E-Commerce Multi-Tier Pricing
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActivePage('home')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Catalog
            </button>
            <button
              type="button"
              onClick={() => setActivePage('product-details')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Product Details
            </button>
            <button
              type="button"
              onClick={() => setActivePage('cart')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Shopping Cart
            </button>
            <button
              type="button"
              onClick={() => setActivePage('admin')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Product Management
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
