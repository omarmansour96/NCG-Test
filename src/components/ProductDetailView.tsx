import React, { useState, useEffect, useMemo } from 'react';
import { Brand, Category, Product, PricingTier } from '../types/catalog';
import {
  formatKWD,
  calculateInternalPackQuantity,
  calculateLineTotal,
  calculateEffectiveUnitPrice,
} from '../utils/pricing';
import { ProductImage } from './ProductImage';
import { ArrowLeft, Minus, Plus, ShoppingBag, Check, Settings, Layers } from 'lucide-react';

interface ProductDetailViewProps {
  products: Product[];
  selectedProductId: string | null;
  brands: Brand[];
  categories: Category[];
  pricingTiers: PricingTier[];
  onSelectProduct: (productId: string) => void;
  onBackToCatalog: () => void;
  onAddToCart: (product: Product, tier: PricingTier, bundleQuantity: number) => void;
  onGoToCart: () => void;
  onOpenAdmin: () => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  products,
  selectedProductId,
  brands,
  categories,
  pricingTiers,
  onSelectProduct,
  onBackToCatalog,
  onAddToCart,
  onGoToCart,
  onOpenAdmin,
}) => {
  const activeProduct = useMemo(() => {
    if (selectedProductId) {
      const found = products.find((p) => p.id === selectedProductId);
      if (found) return found;
    }
    return products[0] || null;
  }, [products, selectedProductId]);

  const productTiers = useMemo(() => {
    if (!activeProduct) return [];
    return pricingTiers
      .filter((t) => t.productId === activeProduct.id)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.unitsPerBundle - b.unitsPerBundle);
  }, [pricingTiers, activeProduct]);

  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [bundleQuantity, setBundleQuantity] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);

  useEffect(() => {
    if (productTiers.length > 0) {
      const stillValid = productTiers.some((t) => t.id === selectedTierId);
      if (!stillValid) {
        setSelectedTierId(productTiers[0].id);
      }
    } else {
      setSelectedTierId('');
    }
    setBundleQuantity(1);
    setAddedFeedback(false);
  }, [activeProduct?.id, productTiers]);

  if (!activeProduct) {
    return (
      <div className="max-w-[1380px] mx-auto px-6 py-12 text-center">
        <h2 className="font-display text-lg font-bold text-slate-900 mb-2">No Products Available</h2>
        <p className="text-sm text-slate-600 mb-6">
          Please add a product in the Admin Panel or restore default sample data.
        </p>
        <button
          type="button"
          onClick={onBackToCatalog}
          className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-xl hover:bg-teal-800 cursor-pointer"
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  const brand = brands.find((b) => b.id === activeProduct.brandId);
  const category = categories.find((c) => c.id === activeProduct.categoryId);
  const activeTier = productTiers.find((t) => t.id === selectedTierId) || productTiers[0];

  const derivedInternalPacks = activeTier
    ? calculateInternalPackQuantity(activeTier.unitsPerBundle, bundleQuantity)
    : 0;
  const calculatedLineTotal = activeTier
    ? calculateLineTotal(activeTier.bundlePrice, bundleQuantity)
    : 0;

  const handleAdd = () => {
    if (!activeTier || bundleQuantity < 1) return;
    onAddToCart(activeProduct, activeTier, bundleQuantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  return (
    <div className="max-w-[1380px] mx-auto px-6 py-8 space-y-8">
      {/* Top Breadcrumb, Product Switcher & Admin Shortcut */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-teal-700 transition-colors cursor-pointer self-start lg:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Medical Catalog</span>
        </button>

        {/* Product Switcher Tabs for quick inspection of Product A (1 Tier), Product B (2 Tiers), Product C (3 Tiers) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {products.map((p) => {
            const count = pricingTiers.filter((t) => t.productId === p.id).length;
            const isCurrent = p.id === activeProduct.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProduct(p.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.name.split('—')[0].trim()} · {count} {count === 1 ? 'Pricing Option' : 'Pricing Options'}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenAdmin}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Edit Tiers in Admin Panel</span>
        </button>
      </div>

      {/* Main Contiguous 2-Column PDP Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Studio Product Gallery & Clinical Specifications */}
        <div className="lg:col-span-6 space-y-6">
          <div className="aspect-[4/3] bg-white border border-slate-200/90 rounded-3xl overflow-hidden">
            <ProductImage
              src={activeProduct.imageUrl}
              alt={activeProduct.name}
              sku={activeProduct.sku}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Clinical Specifications & Product Overview
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">{activeProduct.description}</p>
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Manufacturer Brand</span>
                <span className="font-bold text-slate-900">{brand?.name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Clinical Category</span>
                <span className="font-bold text-slate-900">{category?.name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Catalog SKU</span>
                <span className="font-mono font-bold text-teal-800">{activeProduct.sku}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contiguous Multi-Tier Bundle Purchase Module */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 flex-wrap">
              <span className="font-semibold text-teal-800">{brand?.name || 'Unassigned Brand'}</span>
              <span aria-hidden="true">·</span>
              <span>{category?.name || 'Unassigned Category'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">SKU: {activeProduct.sku}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
              {activeProduct.name}
            </h1>
          </div>

          {/* Step 1: Select an Offer (Pricing Tier) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 inline-flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-700" />
                <span>1. Select Bundle Pricing Option</span>
              </label>
              <span className="text-xs text-teal-800 font-mono font-semibold">
                {productTiers.length} {productTiers.length === 1 ? 'Available Offer' : 'Available Offers'}
              </span>
            </div>

            {productTiers.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                This product currently has no pricing tiers configured.
              </div>
            ) : (
              <div
                className="space-y-2.5"
                role="radiogroup"
                aria-label="Available bundle pricing options"
              >
                {productTiers.map((tier) => {
                  const isSelected = activeTier?.id === tier.id;
                  const perPackCost = calculateEffectiveUnitPrice(
                    tier.bundlePrice,
                    tier.unitsPerBundle
                  );
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedTierId(tier.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50/70 border-teal-700 ring-1 ring-teal-700'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {tier.label} Offer
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          Includes{' '}
                          <span className="font-mono font-bold text-slate-900">
                            {tier.unitsPerBundle}
                          </span>{' '}
                          {tier.unitsPerBundle === 1 ? 'individual pack' : 'individual packs'} per bundle
                          <span className="mx-1.5 text-slate-400">·</span>
                          <span className="font-mono text-slate-500">
                            {formatKWD(perPackCost)} / pack
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-4">
                        <div className="text-lg font-bold font-mono text-teal-800 tabular-nums">
                          {formatKWD(tier.bundlePrice)}
                        </div>
                        <div className="text-[11px] text-slate-500">bundle price</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Select Number of Bundles */}
          {activeTier && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label htmlFor="pdp-bundle-qty" className="text-xs font-bold text-slate-900">
                  2. Select Number of Bundles
                </label>
                <span className="text-xs text-slate-500 font-mono">
                  1 bundle = {activeTier.unitsPerBundle}{' '}
                  {activeTier.unitsPerBundle === 1 ? 'pack' : 'packs'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center border border-slate-300 rounded-xl bg-white">
                  <button
                    type="button"
                    aria-label="Decrease bundle quantity"
                    disabled={bundleQuantity <= 1}
                    onClick={() => setBundleQuantity((q) => Math.max(1, q - 1))}
                    className="p-3 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    id="pdp-bundle-qty"
                    type="number"
                    min={1}
                    max={999}
                    value={bundleQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (Number.isFinite(val) && val >= 1) {
                        setBundleQuantity(Math.min(999, val));
                      }
                    }}
                    className="w-16 text-center text-sm font-mono font-bold text-slate-900 focus:outline-none py-2"
                  />
                  <button
                    type="button"
                    aria-label="Increase bundle quantity"
                    onClick={() => setBundleQuantity((q) => Math.min(999, q + 1))}
                    className="p-3 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick bundle quantity presets */}
                <div className="flex items-center gap-2">
                  {[1, 2, 5].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBundleQuantity(preset)}
                      className={`px-3 py-2 text-xs font-mono rounded-xl border transition-colors cursor-pointer ${
                        bundleQuantity === preset
                          ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset} {preset === 1 ? 'bundle' : 'bundles'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Live Price & Internal Pack Quantity Breakdown */}
          {activeTier && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300">
                  Live Multi-Tier Bundle Calculation
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {formatKWD(activeTier.bundlePrice)} × {bundleQuantity}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-1">
                <div>
                  <div className="text-[11px] text-slate-400">Customer Sees in Cart</div>
                  <div
                    data-testid="pdp-customer-sees"
                    className="text-sm font-bold text-white mt-1"
                  >
                    {bundleQuantity} × {activeTier.label} offer
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400">Internal Pack Quantity</div>
                  <div
                    data-testid="pdp-internal-packs"
                    className="text-sm font-bold font-mono text-teal-300 mt-1"
                  >
                    {derivedInternalPacks} {derivedInternalPacks === 1 ? 'pack' : 'packs'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Calculated Line Total</div>
                  <div
                    data-testid="pdp-line-total"
                    className="text-lg font-bold font-mono text-white tabular-nums mt-0.5"
                  >
                    {formatKWD(calculatedLineTotal)}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800">
                Uses selected bundle price ({formatKWD(activeTier.bundlePrice)}) × {bundleQuantity}{' '}
                {bundleQuantity === 1 ? 'bundle' : 'bundles'} = {formatKWD(calculatedLineTotal)}{' '}
                ({derivedInternalPacks} internal packs).
              </div>
            </div>
          )}

          {/* Primary CTA Buttons */}
          {activeTier && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleAdd}
                className={`flex-1 py-3.5 px-6 text-sm font-bold text-white rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer ${
                  addedFeedback ? 'bg-emerald-700' : 'bg-teal-700 hover:bg-teal-800'
                }`}
              >
                {addedFeedback ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added {bundleQuantity} × {activeTier.label} to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      Add Selected Offer to Cart · {formatKWD(calculatedLineTotal)}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onGoToCart}
                className="py-3.5 px-5 text-sm font-semibold text-slate-800 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Review Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
