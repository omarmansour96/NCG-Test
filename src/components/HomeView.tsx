import React, { useState, useMemo } from 'react';
import { Brand, Category, Product, PricingTier } from '../types/catalog';
import { HERO_STOREFRONT_IMAGE } from '../data/seedCatalog';
import { formatKWD, calculateEffectiveUnitPrice } from '../utils/pricing';
import { ProductImage } from './ProductImage';
import {
  Search,
  ShoppingBag,
  ArrowUpRight,
  RotateCcw,
  SlidersHorizontal,
  Settings,
  Layers,
  Check,
} from 'lucide-react';

interface HomeViewProps {
  products: Product[];
  brands: Brand[];
  categories: Category[];
  pricingTiers: PricingTier[];
  onSelectProduct: (productId: string) => void;
  onAddToCart: (product: Product, tier: PricingTier, bundleQuantity: number) => void;
  onOpenAdmin: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  brands,
  categories,
  pricingTiers,
  onSelectProduct,
  onAddToCart,
  onOpenAdmin,
}) => {
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTierByProduct, setSelectedTierByProduct] = useState<Record<string, string>>({});
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null);

  const brandMap = useMemo(() => {
    const map: Record<string, Brand> = {};
    for (const b of brands) map[b.id] = b;
    return map;
  }, [brands]);

  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    for (const c of categories) map[c.id] = c;
    return map;
  }, [categories]);

  const tiersByProduct = useMemo(() => {
    const map: Record<string, PricingTier[]> = {};
    for (const tier of pricingTiers) {
      if (!map[tier.productId]) map[tier.productId] = [];
      map[tier.productId].push(tier);
    }
    for (const pid of Object.keys(map)) {
      map[pid].sort((a, b) => a.sortOrder - b.sortOrder || a.unitsPerBundle - b.unitsPerBundle);
    }
    return map;
  }, [pricingTiers]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedBrandId !== 'all' && p.brandId !== selectedBrandId) return false;
      if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchDesc) return false;
      }
      return true;
    });
  }, [products, selectedBrandId, selectedCategoryId, searchQuery]);

  const handleQuickAdd = (product: Product, activeTier: PricingTier) => {
    onAddToCart(product, activeTier, 1);
    const key = `${product.id}::${activeTier.id}`;
    setJustAddedKey(key);
    setTimeout(() => {
      setJustAddedKey((prev) => (prev === key ? null : prev));
    }, 1400);
  };

  return (
    <div className="max-w-[1380px] mx-auto px-6 py-8 space-y-10">
      {/* Prominent Storefront & Admin Workspace Switcher Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-teal-300" />
          </div>
          <div>
            <div className="text-xs font-semibold text-teal-300">
              Store Manager & Assessment Control Bar · لوحة التحكم وإدارة المنتجات
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Add, edit, or delete products, brands, categories, and dynamic multi-tier KWD pricing offers in real time.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAdmin}
          data-testid="hero-open-admin-btn"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span>Open Admin Panel (لوحة التحكم)</span>
        </button>
      </div>

      {/* Section 1: Architectural Split-Screen Storefront Hero */}
      <section className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-8">
          <div className="space-y-4">
            <div className="text-xs font-bold tracking-wide text-teal-800">
              National Care Group · مجموعة العناية الوطنية · Kuwait Clinical Supply
            </div>
            <h1
              className="font-display text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.12]"
              style={{ textWrap: 'balance' }}
            >
              Precision Medical Supplies & Multi-Tier Clinical Bundles
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
              Equipping hospitals, outpatient clinics, and surgical centers across Kuwait with
              ISO-certified diagnostic instruments and sterile wound care consumables. Order single
              packs or volume multi-pack bundles with transparent KWD pricing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#catalog-grid"
              className="px-6 py-3 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Browse Clinical Catalog ({products.length} Products)
            </a>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-5 py-3 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-teal-700" />
              <span>Manage Catalog & Pricing Tiers</span>
            </button>
          </div>

          {/* 3-Column Clinical Metrics Strip */}
          <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-6">
            <div>
              <div className="font-display text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {products.length} Products
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                1, 2 & 3 Tier Bundle Options
              </div>
            </div>
            <div>
              <div className="font-display text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {pricingTiers.length} Offers
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Independent Bundle Pricing
              </div>
            </div>
            <div>
              <div className="font-display text-xl sm:text-2xl font-bold text-teal-800 font-mono tabular-nums">
                KWD (.000)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Kuwaiti Dinar 3-Decimal Precision
              </div>
            </div>
          </div>
        </div>

        {/* Right Hero Showroom Photography */}
        <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full bg-slate-900 overflow-hidden">
          <ProductImage
            src={HERO_STOREFRONT_IMAGE}
            alt="National Care Group Clinical Showroom"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent flex flex-col justify-end p-8 text-white">
            <div className="text-xs font-semibold text-teal-300 mb-1">
              Multi-Tier Pricing Architecture
            </div>
            <p className="text-sm text-slate-100 leading-relaxed">
              Each pricing tier is an independent bundle offer with its own pack count and total
              bundle price, synced live with Firebase Firestore.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Interactive Filter Toolbar (Category Tabs, Brand Tabs, Search) */}
      <section
        id="catalog-grid"
        aria-label="Catalog Filters"
        className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Medical Product Catalog
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter by clinical category or manufacturer brand, or select a multi-pack offer directly below.
            </p>
          </div>

          {/* Search Input + Reset */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="catalog-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, SKU, or specification..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            {(selectedBrandId !== 'all' || selectedCategoryId !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBrandId('all');
                  setSelectedCategoryId('all');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive Filter Controls for Categories & Brands */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Filter Group */}
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-2">
              Filter by Category ({categories.length})
            </div>
            <div
              className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-xl"
              role="group"
              aria-label="Filter by Category"
            >
              <button
                type="button"
                onClick={() => setSelectedCategoryId('all')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategoryId === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Categories ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                const isActive = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand Filter Group */}
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-2">
              Filter by Brand ({brands.length})
            </div>
            <div
              className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-xl"
              role="group"
              aria-label="Filter by Brand"
            >
              <button
                type="button"
                onClick={() => setSelectedBrandId('all')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedBrandId === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Brands ({products.length})
              </button>
              {brands.map((brand) => {
                const count = products.filter((p) => p.brandId === brand.id).length;
                const isActive = selectedBrandId === brand.id;
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => setSelectedBrandId(brand.id)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {brand.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: 3-Column Architectural Product Showcase Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-600">
            Showing <span className="font-bold text-slate-900 font-mono">{filteredProducts.length}</span>{' '}
            of <span className="font-bold text-slate-900 font-mono">{products.length}</span> clinical products
          </p>
          <span className="text-xs text-slate-500">
            Select any bundle tier below to calculate price or add directly to cart
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-14 text-center max-w-lg mx-auto">
            <h3 className="font-display text-lg font-bold text-slate-900 mb-1.5">
              No matching medical products found
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Try clearing your active brand, category, or search filters to view the full catalog.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedBrandId('all');
                setSelectedCategoryId('all');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-700 rounded-xl hover:bg-teal-800 transition-colors cursor-pointer"
            >
              Show All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {filteredProducts.map((product) => {
              const brand = brandMap[product.brandId];
              const category = categoryMap[product.categoryId];
              const tiers = tiersByProduct[product.id] || [];
              const selectedTierId = selectedTierByProduct[product.id] || tiers[0]?.id || '';
              const activeTier = tiers.find((t) => t.id === selectedTierId) || tiers[0];

              return (
                <article
                  key={product.id}
                  className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-1 hover:border-slate-300"
                >
                  <div>
                    {/* 4:3 Studio Product Photography Header */}
                    <div
                      onClick={() => onSelectProduct(product.id)}
                      className="aspect-[4/3] bg-slate-100 border-b border-slate-100 relative overflow-hidden cursor-pointer group"
                    >
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        sku={product.sku}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Product Title & Unboxed Metadata */}
                    <div className="p-6">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 flex-wrap">
                        <span className="font-semibold text-slate-700">
                          {brand?.name || 'Unassigned Brand'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{category?.name || 'Unassigned Category'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-teal-800 font-semibold">
                          {tiers.length} {tiers.length === 1 ? 'Pricing Option' : 'Pricing Options'}
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-slate-900 leading-snug mb-2">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product.id)}
                          className="text-left hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          {product.name}
                        </button>
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 mb-5 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Dynamic Multi-Tier Selector */}
                      <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
                          <span className="font-semibold text-slate-700 inline-flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-teal-700" />
                            <span>Available Bundle Offers</span>
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            SKU: {product.sku}
                          </span>
                        </div>

                        {tiers.length === 0 ? (
                          <p className="text-xs text-amber-700 py-2">
                            No pricing options configured. Add tiers in the Admin Panel.
                          </p>
                        ) : (
                          <div
                            className="space-y-2"
                            role="radiogroup"
                            aria-label={`Pricing options for ${product.name}`}
                          >
                            {tiers.map((tier) => {
                              const isSelected = activeTier?.id === tier.id;
                              const unitPrice = calculateEffectiveUnitPrice(
                                tier.bundlePrice,
                                tier.unitsPerBundle
                              );
                              return (
                                <button
                                  key={tier.id}
                                  type="button"
                                  role="radio"
                                  aria-checked={isSelected}
                                  onClick={() =>
                                    setSelectedTierByProduct((prev) => ({
                                      ...prev,
                                      [product.id]: tier.id,
                                    }))
                                  }
                                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer border ${
                                    isSelected
                                      ? 'bg-teal-50/80 border-teal-700 text-slate-900 font-semibold'
                                      : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100/80'
                                  }`}
                                >
                                  <div className="text-left truncate pr-2">
                                    <span className="font-bold text-slate-900">{tier.label}</span>
                                    <span className="text-slate-500 font-normal ml-1.5">
                                      ({tier.unitsPerBundle}{' '}
                                      {tier.unitsPerBundle === 1 ? 'pack' : 'packs'})
                                    </span>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-mono font-bold text-teal-800 tabular-nums">
                                      {formatKWD(tier.bundlePrice)}
                                    </span>
                                    {tier.unitsPerBundle > 1 && (
                                      <span className="block text-[10px] font-mono text-slate-500">
                                        {formatKWD(unitPrice)}/pack
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Action Bar */}
                  <div className="px-6 pb-6 pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product.id)}
                      aria-label={`View details for ${product.name}`}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Product Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    {activeTier && (
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(product, activeTier)}
                        aria-label={`Add ${activeTier.label} of ${product.name} to cart`}
                        className={`flex-1 py-2.5 px-4 text-xs font-semibold text-white rounded-xl transition-colors whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                          justAddedKey === `${product.id}::${activeTier.id}`
                            ? 'bg-emerald-700'
                            : 'bg-teal-700 hover:bg-teal-800'
                        }`}
                      >
                        {justAddedKey === `${product.id}::${activeTier.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Added to Cart</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Add {activeTier.label} · {formatKWD(activeTier.bundlePrice)}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
