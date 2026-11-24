# National Care Group — Medical E-Commerce & Multi-Tier Pricing

A full-stack medical e-commerce storefront and dynamic product management platform built for the **National Care Group (مجموعة العناية الوطنية)** Vibe Coder Technical Assessment.

---

## 1. Scope & Implemented Pages

1. **Home Page / Product Listing (`Catalog`)**:
   - Displays all catalog products with their images, SKU codes, brand, category, and dynamic pricing options.
   - Pre-seeded in Firebase Firestore with the three required benchmark products:
     - **Product A — Digital Fiber-Optic LED Otoscope Kit**: **1 pricing option** (`1 pack` at `12.500 KWD`).
     - **Product B — Advanced Hydrocolloid Sterile Wound Dressings**: **2 pricing options** (`1 pack` at `8.750 KWD`, `4 packs` at `31.000 KWD`).
     - **Product C — Surgical Nitrile Examination Gloves (Powder-Free)**: **3 pricing options** (`1 pack` at `5.500 KWD`, `4 packs` at `19.500 KWD`, `12 packs` at `55.000 KWD`).
   - Supports filtering by **Brand** (`SteriShield Medical`, `Al-Kuwait Diagnostics`), **Category** (`Surgical & Wound Care`, `Diagnostic Instruments`), and search query.
   - Allows customers to select a pricing option directly on the card and add it to the cart or open the dedicated Product Details page.

2. **Product Details Page (`Product Details`)**:
   - Displays full clinical product specifications, brand, category, and all available pricing tiers.
   - Allows customers to choose a bundle offer and select the number of bundles.
   - Automatically calculates and displays:
     - **Customer Sees in Cart** (e.g., `2 × 4 packs offer`)
     - **Internal Pack Quantity** (e.g., `8 packs`)
     - **Calculated Line Total** in Kuwaiti Dinars with three decimal places (e.g., `39.000 KWD`).

3. **Shopping Cart (`Shopping Cart`)**:
   - Maintains different pricing tiers for the same product as **separate cart line items** (keyed by `${productId}::${tierId}`).
   - Uses the selected bundle price when calculating line totals and grand totals (never treats bundle price as a per-pack price).
   - Supports bundle quantity updates and item removal with automatic recalculation of internal pack quantities and KWD totals.

4. **Admin Side — Product Listing & Management (`Product Management`)**:
   - Full CRUD interface backed by **Firebase Firestore**:
     - Create, edit, and delete products (name, SKU, description, image, brand, category).
     - Add, edit, and remove any number of dynamic pricing tiers (`label`, `unitsPerBundle`, `bundlePrice` in KWD) per product.
     - Manage Brands and Categories with referential integrity checks.
     - All changes persist in Firestore across page refreshes and reflect immediately on the storefront via real-time `onSnapshot` listeners.

---

## 2. Project Structure

```text
├── firebase-blueprint.json       # Entity schemas & Firestore collection mapping
├── firestore.rules               # Hardened Firestore security rules (Eight Pillars)
├── security_spec.md              # Phase 0 Security TDD specification
├── public/images/                # Clinical product SVG illustrations (product-a, b, c)
└── src/
    ├── firebase.ts               # Firebase SDK initialization, connection test & error handler
    ├── types/catalog.ts          # TypeScript interfaces (Brand, Category, Product, PricingTier, CartItem)
    ├── data/seedCatalog.ts       # Initial benchmark seed data (Products A, B, C)
    ├── services/catalogService.ts# Firestore CRUD and atomic batch persistence
    ├── utils/
    │   ├── pricing.ts            # Pure multi-tier bundle pricing & KWD formatting functions
    │   └── pricing.test.ts       # Automated unit tests (node:test)
    └── components/
        ├── TopBar.tsx            # Navigation header
        ├── HomeView.tsx          # Page 1: Storefront & Brand/Category Filtering
        ├── ProductDetailView.tsx # Page 2: Product Details & Bundle Calculator
        ├── CartView.tsx          # Page 3: Multi-Tier Shopping Cart
        ├── AdminView.tsx         # Page 4: Store Manager Product/Brand/Category/Tier CRUD
        ├── ProductImage.tsx      # Resilient product image component
        └── ErrorBoundary.tsx     # Diagnostic error boundary
```

---

## 3. Technologies & AI Tools Used

- **Development Environment**: Google AI Studio Build
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Backend & Database**: Firebase Firestore (NoSQL real-time document database with hardened security rules)
- **Icons**: `lucide-react`
- **Testing**: Node.js built-in test runner (`node:test` via `tsx`) + Playwright CLI headless Chromium verification

---

## 4. Setup & Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run unit tests:
   ```bash
   npx --yes tsx --test src/utils/pricing.test.ts
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

---

## 5. Known Limitations

- As specified in the assessment brief ("Out of scope: Authentication, checkout, payment, delivery, order and inventory management are not required"), the application uses public catalog read/write access for demonstration and evaluation convenience without requiring login walls or payment gateways.
