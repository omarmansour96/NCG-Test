import React from 'react';
import { ActivePage } from '../types/catalog';
import { ShoppingBag } from 'lucide-react';

interface TopBarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  totalCartBundles: number;
  totalCartKWD: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  activePage,
  onNavigate,
  totalCartBundles,
  totalCartKWD,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
      <div className="max-w-[1380px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#catalog"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('home');
          }}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-teal-800 transition-colors"
        >
          National Care Group
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="flex items-center gap-7 text-sm font-semibold text-slate-600 overflow-x-auto"
        >
          <a
            href="#catalog"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
            className={`py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activePage === 'home'
                ? 'text-teal-800 border-teal-700 font-bold'
                : 'border-transparent hover:text-slate-950'
            }`}
          >
            Storefront
          </a>
          <a
            href="#product-details"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('product-details');
            }}
            className={`py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activePage === 'product-details'
                ? 'text-teal-800 border-teal-700 font-bold'
                : 'border-transparent hover:text-slate-950'
            }`}
          >
            Product Details
          </a>
          <a
            href="#cart"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('cart');
            }}
            className={`py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activePage === 'cart'
                ? 'text-teal-800 border-teal-700 font-bold'
                : 'border-transparent hover:text-slate-950'
            }`}
          >
            Shopping Cart
          </a>
          <a
            href="#admin"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('admin');
            }}
            className={`py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activePage === 'admin'
                ? 'text-teal-800 border-teal-700 font-bold'
                : 'border-transparent hover:text-slate-950'
            }`}
          >
            Admin Panel
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('cart')}
            aria-label={`View Shopping Cart (${totalCartBundles} bundles, ${totalCartKWD})`}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 shrink-0 text-teal-400" />
            <span>
              Cart ({totalCartBundles}) · {totalCartKWD}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
