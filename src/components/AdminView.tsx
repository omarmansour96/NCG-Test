import React, { useState } from 'react';
import { Brand, Category, Product, PricingTier } from '../types/catalog';
import {
  PRODUCT_A_IMAGE,
  PRODUCT_B_IMAGE,
  PRODUCT_C_IMAGE,
} from '../data/seedCatalog';
import { formatKWD, toValidSlug, validatePricingTierInput } from '../utils/pricing';
import {
  saveBrandToFirestore,
  deleteBrandFromFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  saveProductWithTiersToFirestore,
  deleteProductWithTiersFromFirestore,
  resetToDefaultAssessmentCatalog,
} from '../services/catalogService';
import { ProductImage } from './ProductImage';
import { Plus, Trash2, Edit3, Check, RotateCcw, X, ArrowLeft, Layers } from 'lucide-react';

interface AdminViewProps {
  products: Product[];
  brands: Brand[];
  categories: Category[];
  pricingTiers: PricingTier[];
  onBackToStorefront: () => void;
}

interface EditableTierRow {
  id: string;
  label: string;
  unitsPerBundle: string;
  bundlePrice: string;
}

export const AdminView: React.FC<AdminViewProps> = ({
  products,
  brands,
  categories,
  pricingTiers,
  onBackToStorefront,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'brands' | 'categories'>('products');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Product Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState(PRODUCT_A_IMAGE);
  const [prodBrandId, setProdBrandId] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [tierRows, setTierRows] = useState<EditableTierRow[]>([
    { id: `tier-${Date.now()}-1`, label: '1 pack', unitsPerBundle: '1', bundlePrice: '5.500' },
  ]);

  // Brand Form State
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');

  // Category Form State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');

  const showNotice = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Open Create Product Form
  const handleStartCreateProduct = () => {
    setEditingProductId(null);
    setProdName('');
    setProdSku(`NCG-MED-${Math.floor(100 + Math.random() * 899)}`);
    setProdDescription('');
    setProdImageUrl(PRODUCT_A_IMAGE);
    setProdBrandId(brands[0]?.id || '');
    setProdCategoryId(categories[0]?.id || '');
    setTierRows([
      { id: `tier-${Date.now()}-1`, label: '1 pack', unitsPerBundle: '1', bundlePrice: '5.500' },
    ]);
    setShowProductForm(true);
  };

  // Open Edit Product Form
  const handleStartEditProduct = (product: Product) => {
    const existingTiers = pricingTiers
      .filter((t) => t.productId === product.id)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.unitsPerBundle - b.unitsPerBundle);

    setEditingProductId(product.id);
    setProdName(product.name);
    setProdSku(product.sku);
    setProdDescription(product.description);
    setProdImageUrl(product.imageUrl);
    setProdBrandId(product.brandId);
    setProdCategoryId(product.categoryId);
    setTierRows(
      existingTiers.length > 0
        ? existingTiers.map((t) => ({
            id: t.id,
            label: t.label,
            unitsPerBundle: String(t.unitsPerBundle),
            bundlePrice: t.bundlePrice.toFixed(3),
          }))
        : [{ id: `tier-${Date.now()}-1`, label: '1 pack', unitsPerBundle: '1', bundlePrice: '5.500' }]
    );
    setShowProductForm(true);
  };

  const handleAddTierRow = () => {
    setTierRows((prev) => [
      ...prev,
      {
        id: `tier-${Date.now()}-${prev.length + 1}`,
        label: `${(prev.length + 1) * 2} packs`,
        unitsPerBundle: String((prev.length + 1) * 2),
        bundlePrice: '15.000',
      },
    ]);
  };

  const handleRemoveTierRow = (id: string) => {
    if (tierRows.length <= 1) {
      showNotice('error', 'Each product must have at least one pricing option.');
      return;
    }
    setTierRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      showNotice('error', 'Product name is required.');
      return;
    }
    if (!prodSku.trim()) {
      showNotice('error', 'Product SKU is required.');
      return;
    }
    if (!prodDescription.trim()) {
      showNotice('error', 'Product description is required.');
      return;
    }
    if (!prodBrandId || !prodCategoryId) {
      showNotice('error', 'Please select both a Brand and a Category.');
      return;
    }
    if (tierRows.length === 0) {
      showNotice('error', 'At least one pricing tier is required.');
      return;
    }

    const parsedTiers: PricingTier[] = [];
    const productId = editingProductId || `prod-${toValidSlug(prodName)}-${Date.now().toString().slice(-4)}`;

    for (let i = 0; i < tierRows.length; i++) {
      const row = tierRows[i];
      const units = Number(row.unitsPerBundle);
      const price = Number(row.bundlePrice);
      const check = validatePricingTierInput({
        label: row.label,
        unitsPerBundle: units,
        bundlePrice: price,
      });
      if (!check.valid) {
        showNotice('error', `Tier #${i + 1}: ${check.error}`);
        return;
      }
      parsedTiers.push({
        id: row.id.replace(/[^a-zA-Z0-9_-]/g, '-'),
        productId,
        label: row.label.trim(),
        unitsPerBundle: units,
        bundlePrice: Number(price.toFixed(3)),
        sortOrder: i + 1,
      });
    }

    const existingProductTierIds = pricingTiers
      .filter((t) => t.productId === productId)
      .map((t) => t.id);
    const currentTierIds = new Set(parsedTiers.map((t) => t.id));
    const removedTierIds = existingProductTierIds.filter((id) => !currentTierIds.has(id));

    setIsSaving(true);
    try {
      await saveProductWithTiersToFirestore(
        {
          id: productId,
          name: prodName.trim(),
          sku: prodSku.trim().replace(/[^a-zA-Z0-9_-]/g, '-'),
          description: prodDescription.trim(),
          imageUrl: prodImageUrl.trim() || PRODUCT_A_IMAGE,
          brandId: prodBrandId,
          categoryId: prodCategoryId,
        },
        parsedTiers,
        removedTierIds
      );
      setShowProductForm(false);
      setEditingProductId(null);
      showNotice('success', `Saved "${prodName.trim()}" and ${parsedTiers.length} pricing tier(s) to Firestore.`);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const tierIds = pricingTiers.filter((t) => t.productId === product.id).map((t) => t.id);
    setIsSaving(true);
    try {
      await deleteProductWithTiersFromFirestore(product.id, tierIds);
      showNotice('success', `Deleted "${product.name}" and its pricing tiers from Firestore.`);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to delete product.');
    } finally {
      setIsSaving(false);
    }
  };

  // Brand Handlers
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      showNotice('error', 'Brand name is required.');
      return;
    }
    const id = editingBrandId || `brand-${toValidSlug(brandName)}`;
    const slug = toValidSlug(brandName);
    setIsSaving(true);
    try {
      await saveBrandToFirestore({
        id,
        name: brandName.trim(),
        slug,
        description: brandDescription.trim() || `${brandName.trim()} medical products.`,
      });
      setEditingBrandId(null);
      setBrandName('');
      setBrandDescription('');
      showNotice('success', `Saved brand "${brandName.trim()}" to Firestore.`);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to save brand.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBrand = async (brand: Brand) => {
    const linkedProducts = products.filter((p) => p.brandId === brand.id);
    if (linkedProducts.length > 0) {
      showNotice(
        'error',
        `Cannot delete "${brand.name}" while ${linkedProducts.length} product(s) are assigned to it.`
      );
      return;
    }
    setIsSaving(true);
    try {
      await deleteBrandFromFirestore(brand.id);
      showNotice('success', `Deleted brand "${brand.name}" from Firestore.`);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to delete brand.');
    } finally {
      setIsSaving(false);
    }
  };

  // Category Handlers
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showNotice('error', 'Category name is required.');
      return;
    }
    const id = editingCategoryId || `cat-${toValidSlug(catName)}`;
    const slug = toValidSlug(catName);
    setIsSaving(true);
    try {
      await saveCategoryToFirestore({
        id,
        name: catName.trim(),
        slug,
        description: catDescription.trim() || `${catName.trim()} catalog category.`,
      });
      setEditingCategoryId(null);
      setCatName('');
      setCatDescription('');
      showNotice('success', `Saved category "${catName.trim()}" to Firestore.`);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    const linkedProducts = products.filter((p) => p.categoryId === cat.id);
    if (linkedProducts.length > 0) {
      showNotice(
        'error',
        `Cannot delete "${cat.name}" while ${linkedProducts.length} product(s) are assigned to it.`
      );
      return;
    }
    setIsSaving(true);
    try {
      await deleteCategoryFromFirestore(cat.id);
      showNotice('success', `Deleted category "${cat.name}" from Firestore.`);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to delete category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetBenchmarkData = async () => {
    setIsSaving(true);
    try {
      await resetToDefaultAssessmentCatalog();
      setShowProductForm(false);
      showNotice('success', 'Restored default Assessment Products A, B, and C in Firestore.');
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to reset catalog.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[1380px] mx-auto px-6 py-8 space-y-8">
      {/* High-Contrast Admin Command Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToStorefront}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Storefront</span>
            </button>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-medium text-slate-400">
              Firebase Firestore Real-Time Sync
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Admin Panel · Product & Multi-Tier Pricing Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Manage medical products, brands, categories, and dynamic bundle pricing tiers. Every
            change is persisted immediately to Firestore and reflected live on the customer storefront.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleResetBenchmarkData}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Default Products A, B & C</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('products');
              handleStartCreateProduct();
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-slate-950 bg-teal-400 rounded-xl hover:bg-teal-300 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Product</span>
          </button>
        </div>
      </div>

      {/* Status Notification Banner */}
      {statusMessage && (
        <div
          role="status"
          className={`px-5 py-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            aria-label="Dismiss notification"
            className="p-1 hover:opacity-75 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Workspace Section Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/80 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'products'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Products & Pricing Tiers ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('brands')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'brands'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Brands ({brands.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Categories ({categories.length})
        </button>
      </div>

      {/* TAB 1: PRODUCTS & DYNAMIC PRICING TIERS */}
      {activeTab === 'products' && (
        <div className="space-y-8">
          {/* Product & Multi-Tier Form Drawer/Panel */}
          {showProductForm && (
            <form
              onSubmit={handleSaveProduct}
              className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  {editingProductId ? 'Edit Product & Multi-Tier Pricing' : 'Create New Product & Multi-Tier Pricing'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="admin-prod-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Product Name
                  </label>
                  <input
                    id="admin-prod-name"
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Sterile Surgical Drapes"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label htmlFor="admin-prod-sku" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Catalog SKU Code
                  </label>
                  <input
                    id="admin-prod-sku"
                    type="text"
                    required
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    placeholder="e.g. NCG-DRP-400"
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label htmlFor="admin-prod-brand" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Brand
                  </label>
                  <select
                    id="admin-prod-brand"
                    value={prodBrandId}
                    onChange={(e) => setProdBrandId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="admin-prod-category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category
                  </label>
                  <select
                    id="admin-prod-category"
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="admin-prod-image" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Product Studio Photography Asset or Image URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="admin-prod-image"
                      type="text"
                      required
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { label: 'Otoscope Studio Photo', url: PRODUCT_A_IMAGE },
                        { label: 'Dressings Studio Photo', url: PRODUCT_B_IMAGE },
                        { label: 'Gloves Studio Photo', url: PRODUCT_C_IMAGE },
                      ].map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setProdImageUrl(preset.url)}
                          className={`px-3 py-2 text-xs rounded-xl border transition-colors cursor-pointer ${
                            prodImageUrl === preset.url
                              ? 'bg-teal-50 border-teal-700 text-teal-800 font-semibold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="admin-prod-desc" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Clinical Description
                  </label>
                  <textarea
                    id="admin-prod-desc"
                    rows={3}
                    required
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    placeholder="Detailed medical specifications, sterilization standard, and pack contents..."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              {/* Dynamic Multi-Tier Pricing Editor */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Dynamic Pricing Tiers (Independent Bundle Offers)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Define any number of pricing options. Each tier has its own units per bundle and total bundle price in KWD.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTierRow}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Pricing Tier</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {tierRows.map((row, idx) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-200"
                    >
                      <div className="sm:col-span-4">
                        <label
                          htmlFor={`tier-label-${idx}`}
                          className="block text-[11px] font-semibold text-slate-600 mb-1"
                        >
                          Offer Label (e.g. 1 pack, 4 packs)
                        </label>
                        <input
                          id={`tier-label-${idx}`}
                          type="text"
                          required
                          value={row.label}
                          onChange={(e) =>
                            setTierRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, label: e.target.value } : r))
                            )
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label
                          htmlFor={`tier-units-${idx}`}
                          className="block text-[11px] font-semibold text-slate-600 mb-1"
                        >
                          Units per Bundle (Packs)
                        </label>
                        <input
                          id={`tier-units-${idx}`}
                          type="number"
                          min={1}
                          step={1}
                          required
                          value={row.unitsPerBundle}
                          onChange={(e) =>
                            setTierRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, unitsPerBundle: e.target.value } : r
                              )
                            )
                          }
                          className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label
                          htmlFor={`tier-price-${idx}`}
                          className="block text-[11px] font-semibold text-slate-600 mb-1"
                        >
                          Bundle Price (KWD)
                        </label>
                        <input
                          id={`tier-price-${idx}`}
                          type="number"
                          min={0.001}
                          step="0.001"
                          required
                          value={row.bundlePrice}
                          onChange={(e) =>
                            setTierRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, bundlePrice: e.target.value } : r
                              )
                            )
                          }
                          className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveTierRow(row.id)}
                          aria-label={`Remove tier ${idx + 1}`}
                          className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-teal-700 rounded-xl hover:bg-teal-800 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving to Firestore...' : 'Save Product & Tiers'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Existing Products List */}
          <div className="space-y-4">
            {products.map((product) => {
              const brand = brands.find((b) => b.id === product.brandId);
              const category = categories.find((c) => c.id === product.categoryId);
              const tiers = pricingTiers
                .filter((t) => t.productId === product.id)
                .sort((a, b) => a.sortOrder - b.sortOrder || a.unitsPerBundle - b.unitsPerBundle);

              return (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-5 max-w-2xl">
                    <div className="w-24 h-20 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shrink-0">
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        sku={product.sku}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 flex-wrap">
                        <span className="font-semibold text-slate-700">
                          {brand?.name || 'Unassigned Brand'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{category?.name || 'Unassigned Category'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{product.sku}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-900">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Tiers Summary */}
                  <div className="flex flex-col sm:flex-row lg:items-center gap-4 justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-500 inline-flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-teal-700" />
                        <span>Configured Pricing Options ({tiers.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tiers.map((t) => (
                          <div
                            key={t.id}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          >
                            <span className="font-bold text-slate-800">{t.label}</span>
                            <span className="text-slate-500 mx-1">
                              ({t.unitsPerBundle} {t.unitsPerBundle === 1 ? 'pack' : 'packs'})
                            </span>
                            <span className="font-mono font-bold text-teal-800">
                              {formatKWD(t.bundlePrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditProduct(product)}
                        aria-label={`Edit ${product.name}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Tiers & Info</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product)}
                        aria-label={`Delete ${product.name}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BRANDS MANAGEMENT */}
      {activeTab === 'brands' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSaveBrand}
            className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
          >
            <h2 className="font-display text-base font-bold text-slate-900">
              {editingBrandId ? 'Edit Brand' : 'Create New Brand'}
            </h2>
            <div>
              <label htmlFor="brand-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Brand Name
              </label>
              <input
                id="brand-name-input"
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Gulf Medical Supplies"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label htmlFor="brand-desc-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="brand-desc-input"
                rows={3}
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                placeholder="Manufacturer specialization and certifications..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2.5 text-xs font-bold text-white bg-teal-700 rounded-xl hover:bg-teal-800 cursor-pointer"
              >
                {editingBrandId ? 'Update Brand' : 'Add Brand'}
              </button>
              {editingBrandId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingBrandId(null);
                    setBrandName('');
                    setBrandDescription('');
                  }}
                  className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {brands.map((brand) => {
              const count = products.filter((p) => p.brandId === brand.id).length;
              return (
                <div
                  key={brand.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {brand.name}{' '}
                      <span className="text-xs font-normal text-slate-500 font-mono">
                        ({count} {count === 1 ? 'product' : 'products'})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{brand.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBrandId(brand.id);
                        setBrandName(brand.name);
                        setBrandDescription(brand.description);
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBrand(brand)}
                      className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 rounded-xl hover:bg-rose-100 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSaveCategory}
            className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
          >
            <h2 className="font-display text-base font-bold text-slate-900">
              {editingCategoryId ? 'Edit Category' : 'Create New Category'}
            </h2>
            <div>
              <label htmlFor="cat-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Category Name
              </label>
              <input
                id="cat-name-input"
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Respiratory Care"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label htmlFor="cat-desc-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="cat-desc-input"
                rows={3}
                value={catDescription}
                onChange={(e) => setCatDescription(e.target.value)}
                placeholder="Category scope and clinical usage..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2.5 text-xs font-bold text-white bg-teal-700 rounded-xl hover:bg-teal-800 cursor-pointer"
              >
                {editingCategoryId ? 'Update Category' : 'Add Category'}
              </button>
              {editingCategoryId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategoryId(null);
                    setCatName('');
                    setCatDescription('');
                  }}
                  className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {cat.name}{' '}
                      <span className="text-xs font-normal text-slate-500 font-mono">
                        ({count} {count === 1 ? 'product' : 'products'})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{cat.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(cat.id);
                        setCatName(cat.name);
                        setCatDescription(cat.description);
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 rounded-xl hover:bg-rose-100 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
