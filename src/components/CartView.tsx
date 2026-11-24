import React from 'react';
import { CartItem } from '../types/catalog';
import {
  formatKWD,
  calculateInternalPackQuantity,
  calculateLineTotal,
  calculateCartSummary,
} from '../utils/pricing';
import { ProductImage } from './ProductImage';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';

interface CartViewProps {
  cart: CartItem[];
  onUpdateQuantity: (key: string, newBundleQuantity: number) => void;
  onRemoveItem: (key: string) => void;
  onClearCart: () => void;
  onContinueShopping: () => void;
  onOpenProductDetails: (productId: string) => void;
}

export const CartView: React.FC<CartViewProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onContinueShopping,
  onOpenProductDetails,
}) => {
  const summary = calculateCartSummary(cart);

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200">
        <div>
          <div className="text-xs font-medium text-teal-700 mb-1">
            Multi-Tier Bundle Order Review
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Shopping Cart
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onContinueShopping}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Browsing Catalog</span>
          </button>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Clear All Items
            </button>
          )}
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-6 h-6 text-slate-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Your shopping cart is empty</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Explore our medical catalog to select single-pack or multi-pack pricing tiers and add
            bundles to your cart.
          </p>
          <button
            type="button"
            onClick={onContinueShopping}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors cursor-pointer"
          >
            Browse Medical Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 8 Columns: Cart Lines */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => {
              const internalPacks = calculateInternalPackQuantity(
                item.unitsPerBundle,
                item.bundleQuantity
              );
              const lineTotal = calculateLineTotal(item.bundlePrice, item.bundleQuantity);

              return (
                <article
                  key={item.key}
                  data-testid={`cart-line-${item.key}`}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row gap-5 justify-between"
                >
                  {/* Product Visual & Selected Offer Info */}
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden shrink-0 p-2">
                      <ProductImage
                        src={item.productImageUrl}
                        alt={item.productName}
                        sku={item.productSku}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
                        <span>{item.brandName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.categoryName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{item.productSku}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => onOpenProductDetails(item.productId)}
                          className="text-left hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          {item.productName}
                        </button>
                      </h3>

                      {/* Assessment Business Logic Breakdown Row */}
                      <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                        <div>
                          <span className="text-slate-500 block">Selected Offer</span>
                          <span className="font-semibold text-slate-900">
                            {item.tierLabel} ({item.unitsPerBundle}{' '}
                            {item.unitsPerBundle === 1 ? 'pack' : 'packs'}/bundle)
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block">Customer Sees in Cart</span>
                          <span className="font-bold text-teal-800">
                            {item.bundleQuantity} × {item.tierLabel} offer
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block">Internal Pack Quantity</span>
                          <span className="font-mono font-bold text-slate-900">
                            {internalPacks} {internalPacks === 1 ? 'pack' : 'packs'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controls & Line Price */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 shrink-0 gap-4">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-500">
                        Bundle Price: <span className="font-mono">{formatKWD(item.bundlePrice)}</span>
                      </div>
                      <div className="text-lg font-bold font-mono text-slate-900 tabular-nums mt-0.5">
                        {formatKWD(lineTotal)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white">
                        <button
                          type="button"
                          aria-label={`Decrease bundle quantity for ${item.productName} (${item.tierLabel})`}
                          disabled={item.bundleQuantity <= 1}
                          onClick={() => onUpdateQuantity(item.key, item.bundleQuantity - 1)}
                          className="p-2 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          aria-label={`Bundle quantity for ${item.productName} (${item.tierLabel})`}
                          value={item.bundleQuantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (Number.isFinite(val) && val >= 1) {
                              onUpdateQuantity(item.key, val);
                            }
                          }}
                          className="w-12 text-center text-xs font-mono font-bold text-slate-900 focus:outline-none py-1.5"
                        />
                        <button
                          type="button"
                          aria-label={`Increase bundle quantity for ${item.productName} (${item.tierLabel})`}
                          onClick={() => onUpdateQuantity(item.key, item.bundleQuantity + 1)}
                          className="p-2 text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.key)}
                        aria-label={`Remove ${item.productName} (${item.tierLabel}) from cart`}
                        className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Right 4 Columns: Cart Summary Panel */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Bundle Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Distinct Offer Lines</span>
                <span className="font-mono font-semibold text-slate-900">
                  {summary.totalDistinctOffers}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Total Selected Bundles</span>
                <span className="font-mono font-semibold text-slate-900">
                  {summary.totalBundles} {summary.totalBundles === 1 ? 'bundle' : 'bundles'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Total Internal Pack Quantity</span>
                <span
                  data-testid="cart-total-internal-packs"
                  className="font-mono font-semibold text-slate-900"
                >
                  {summary.totalInternalPacks} {summary.totalInternalPacks === 1 ? 'pack' : 'packs'}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-900">Grand Total (KWD)</span>
                <span
                  data-testid="cart-grand-total"
                  className="text-xl font-bold font-mono text-teal-800 tabular-nums"
                >
                  {formatKWD(summary.subtotalKWD)}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <div className="font-semibold text-slate-800">Multi-Tier Pricing Verification</div>
              <p>
                Different pricing tiers for the same product are maintained as separate line items.
                Totals are calculated strictly from the selected bundle price in Kuwaiti Dinars
                (KWD) to three decimal places.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
