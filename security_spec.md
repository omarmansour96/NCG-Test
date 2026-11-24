# Security Specification (Phase 0: Payload-First Security TDD)

## 1. Data Invariants
1. **Path ID Hardening**: Every document ID (`brandId`, `categoryId`, `productId`, `tierId`) must match `^[a-zA-Z0-9_\-]+$` and be `<= 128` characters.
2. **Strict Schema & No Shadow Fields**: Every `create` and `update` operation on `brands`, `categories`, `products`, and `pricingTiers` must strictly match the exact required keys (`hasAll` and `hasOnly`), blocking any injected or shadow properties.
3. **Volumetric String Boundaries**: All string fields must enforce explicit `.size()` min/max bounds matching `firebase-blueprint.json` to prevent resource exhaustion ("Denial of Wallet").
4. **Relational Consistency (Master Gate)**:
   - A `Product` cannot be created or updated unless both `exists(/databases/$(database)/documents/brands/$(incoming().brandId))` and `exists(/databases/$(database)/documents/categories/$(incoming().categoryId))` evaluate to `true`.
   - A `PricingTier` cannot be created or updated unless `exists(/databases/$(database)/documents/products/$(incoming().productId))` evaluates to `true`, and on `update` its `productId` is immutable (`incoming().productId == existing().productId`).
5. **Positive Pricing & Bundle Quantities**: Every `PricingTier` must enforce `unitsPerBundle is int && unitsPerBundle >= 1 && unitsPerBundle <= 10000` and `bundlePrice is number && bundlePrice > 0 && bundlePrice <= 1000000`.
6. **Zero PII Exposure**: No PII collections exist (`Out of scope: Authentication, checkout, payment... Use sample data only`). All catalog entities contain strictly public medical product metadata.

## 2. The "Dirty Dozen" Payloads
1. **Payload 1 (Shadow Field Injection on Product)**: Includes `{"name": "Mask", "sku": "SKU-1", "description": "Desc", "imageUrl": "/img.svg", "brandId": "b1", "categoryId": "c1", "isAdmin": true}` -> Rejected by `hasOnly`.
2. **Payload 2 (Negative Bundle Price)**: `{"productId": "prod-a", "label": "4 packs", "unitsPerBundle": 4, "bundlePrice": -5.500, "sortOrder": 1}` -> Rejected by `bundlePrice > 0`.
3. **Payload 3 (Zero Units Per Bundle)**: `{"productId": "prod-a", "label": "0 packs", "unitsPerBundle": 0, "bundlePrice": 5.500, "sortOrder": 1}` -> Rejected by `unitsPerBundle >= 1`.
4. **Payload 4 (Fractional Units Per Bundle)**: `{"productId": "prod-a", "label": "1.5 packs", "unitsPerBundle": 1.5, "bundlePrice": 5.500, "sortOrder": 1}` -> Rejected by `unitsPerBundle is int`.
5. **Payload 5 (Orphaned Product Creation - Non-existent Brand)**: `{"name": "Gloves", "sku": "GLV-1", "description": "Sterile", "imageUrl": "/img.svg", "brandId": "non-existent-brand", "categoryId": "cat-1"}` -> Rejected by `exists(.../brands/$(incoming().brandId))`.
6. **Payload 6 (Orphaned PricingTier Creation - Non-existent Product)**: `{"productId": "ghost-product", "label": "1 pack", "unitsPerBundle": 1, "bundlePrice": 5.5, "sortOrder": 1}` -> Rejected by `exists(.../products/$(incoming().productId))`.
7. **Payload 7 (ID Poisoning Attack)**: Document ID with spaces or special characters `prod/../../hack` or length > 128 -> Rejected by `isValidId()`.
8. **Payload 8 (Denial of Wallet 1MB String on Product Description)**: `description` with 5,000 characters -> Rejected by `data.description.size() <= 2000`.
9. **Payload 9 (Type Poisoning on Brand Name)**: `{"name": 12345, "slug": "brand-1", "description": "Desc"}` -> Rejected by `data.name is string`.
10. **Payload 10 (Invalid Slug Format on Category)**: `{"name": "Category", "slug": "invalid slug with spaces!", "description": "Desc"}` -> Rejected by `data.slug.matches('^[a-zA-Z0-9_\\-]+$')`.
11. **Payload 11 (Mutating Immutable productId on PricingTier Update)**: Changing `productId` from `prod-a` to `prod-b` during update -> Rejected by `incoming().productId == existing().productId`.
12. **Payload 12 (Unmapped Collection Write)**: Writing to `/randomCollection/doc1` -> Rejected by global default-deny catch-all `match /{document=**} { allow read, write: if false; }`.
