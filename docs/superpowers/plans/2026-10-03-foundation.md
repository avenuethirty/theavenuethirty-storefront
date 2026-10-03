# Storefront Foundation Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for native execution, or superpowers:subagent-driven-development if selected by the user. Steps use checkbox syntax for tracking. This plan is awaiting user review and execution-method selection.

**Goal:** Deliver a fresh, previewable TanStack Start department storefront with structured Directus catalogue/content management and a supplier application journey.

**Architecture:** TanStack Start routes consume typed server services backed by Directus. Separate public catalogue access from staff operations and private supplier records. Cart state is shared across departments, while transactional checkout is a separately planned subsystem.

**Tech Stack:** React, TypeScript, TanStack Start/Router, Directus, Supabase Postgres, ImageKit, Embla, Vitest, Playwright. Use npm and pinned compatible releases selected from current official documentation at setup time.

**Spec:** ../specs/2026-10-03-storefront-foundation-design.md, including the Pakistan commerce refinements.

## Global Constraints

- No em dashes in authored content, microcopy, or documents.
- Fresh implementation; no old Google Sheets or HubSpot dependencies.
- Preserve .env and the sibling .archive directory. Never log credentials or commit them.
- One retailer controls all listings, prices, orders, and fulfilment.
- Directus/ImageKit private credentials stay in explicitly server-only modules.
- Departments are configurable. Products have one identity across department appearances.
- Use Embla for carousel behaviours and retain static layouts where appropriate.
- No real order submission until the transactional commerce release is validated.
- Launch commerce must support website and staff-entered WhatsApp/phone orders through the same services; physical POS and external-channel integrations are Phase 2.
- Keep customer and variant identities independent of channel. The commerce schema must model stock by location and include invoices and payment allocations.
- Prefer open-source, self-hosted, and local services. Obtain explicit user approval before integrating any paid service; no provider is approved merely by being mentioned or having credentials supplied.
- No production provider integration, fresh remote repository, or deployment publication is implied by this foundation plan.

## Review Focus

1. A product belongs to two departments but keeps one SKU/inventory identity: Task 3.
2. Separate size and colour matches do not imply a purchasable combination: Task 4.
3. Draft products requested directly stay private: Tasks 2 and 3.
4. A supplier retries a submission after a network timeout without producing duplicate applications: Task 7.
5. An empty carousel or failed CMS request must not break navigation or misrepresent content: Tasks 4 and 5.

## File and module boundaries

- src/routes/: route composition, loaders, metadata, and error boundaries.
- src/features/catalogue/: shared catalogue types, server repository, list queries, and variant selection.
- src/features/departments/: navigation and department context.
- src/features/cart/: variant-keyed local cart with persistence.
- src/features/content/: typed page sections and settings presentation.
- src/features/suppliers/: validated application input and private server submission.
- src/components/: shared UI and carousel wrappers.
- src/server/: validated private environment, Directus transport, media upload authorisation.
- src/styles/: design tokens and global styles.
- directus/: versioned schema description, permissions, validation, and apply scripts.
- tests/: unit, integration, browser, and fixture data.

## Task 1: Runnable application and server-only boundary

**Files:** package.json, package-lock.json, vite.config.ts, tsconfig.json, src/router.tsx, src/routes/__root.tsx, src/routes/index.tsx, src/server/env.ts, src/server/directus.ts, src/styles/tokens.css, .env.example, AGENTS.md, tests/server/env.test.ts.

**Interfaces:** getServerEnv(): { directusUrl: string; directusToken: string }; directusRequest<T>(path: string, init?: RequestInit): Promise<T>. No client module may import either.

- [ ] Confirm current official TanStack setup and compatible versions. Create the minimal React/TypeScript app without overwriting .env; record dependency versions in the lockfile.
- [ ] Add env tests asserting missing private values fail server startup, URLs are validated, and error messages do not contain secret values. Run `npm run test -- tests/server/env.test.ts` and observe the intended failure.
- [ ] Implement server env validation and the Directus transport with timeouts, redacted errors, and rejection of redirects carrying credentials to another origin.
- [ ] Add scripts for dev, build, typecheck, test, and test:e2e. Verify `npm run typecheck`, the focused test, and `npm run build` pass.
- [ ] Render a minimal accessible shell with provisional tokens. Scan client output for private env values without printing those values. Document the fresh architecture in AGENTS.md.

## Task 2: Versioned catalogue schema and permissions

**Files:** directus/schema/catalogue.ts, directus/schema/content.ts, directus/permissions.ts, directus/apply.ts, tests/directus/schema.test.ts, tests/directus/permissions.test.ts.

**Interfaces:** schema declarations describe collections, fields, relationships, constraints, and permission policies; planSchemaChanges(current, desired) returns a reviewable change list; applySchemaChanges(plan) applies only reviewed changes.

- [ ] Read the actual Directus schema and permission model before proposing changes. Capture a protected schema snapshot without account tokens or customer data.
- [ ] Define product/variant, department/category/type, brand, option/attribute, collection, media, navigation, page-section, and settings structures matching the spec. Document money representation and unique constraints consistently.
- [ ] Write tests asserting SKU uniqueness, valid option membership, cross-department product reuse, public publication filtering, and blocked public access to private settings. Run focused tests and observe intended failures.
- [ ] Implement schema and permission declarations plus a dry-run/apply workflow. Reject unexpected destructive changes and make repeat application idempotent.
- [ ] Apply to a designated development environment only after the schema diff is reviewable and the target is confirmed. Create a least-privilege runtime role; keep administrative credentials out of storefront runtime.
- [ ] Run permission tests with public, runtime, and staff identities; verify repeat schema application produces no changes.

## Task 3: Catalogue service and representative data

**Files:** src/features/catalogue/types.ts, src/features/catalogue/catalogue.server.ts, src/features/departments/departments.server.ts, tests/fixtures/catalogue.ts, tests/catalogue/repository.test.ts.

**Interfaces:** listDepartments(): Promise<Department[]>; getDepartment(slug: string): Promise<Department | null>; getProduct(slug: string): Promise<ProductDetail | null>; listProducts(query: CatalogueQuery): Promise<CataloguePage>. CatalogueQuery has department, category, typed filters, sort, page, and pageSize. CataloguePage contains items, total, and facets. ProductDetail contains shared product data, ordered media, attributes, and variants with stable SKU IDs and option values.

- [ ] Define shared domain types independently of Directus relational payloads. Prices include currency and use integer minor units at the application boundary.
- [ ] Write tests for a simple product, multi-option clothing, a phone with storage options, and an appliance with specifications. Assert a shared product is not duplicated, drafts return null, and pagination is stable.
- [ ] Run the focused test, then implement the Directus-to-domain mapping and explicit ordering/filtering. Fetch complete related data without silently truncating variants.
- [ ] Re-run repository tests. Fixtures are development-only, visibly fictitious, and cannot publish automatically to production.

## Task 4: Department navigation and catalogue browsing

**Files:** src/routes/$department/index.tsx, src/routes/$department/shop.tsx, src/features/departments/DepartmentNavigation.tsx, src/features/catalogue/FilterPanel.tsx, src/features/catalogue/ProductCard.tsx, tests/e2e/browsing.spec.ts.

**Interfaces:** route search parameters map to CatalogueQuery; route loaders invoke the server services from Task 3. Department context comes from the route, never from global state overriding the URL.

- [ ] Write browser cases for direct links, department switching, back navigation, shareable filters, zero results, and unavailable CMS responses.
- [ ] Write a variant-filter test where red exists only in small and blue only in large; red plus large must not be presented as an available combination.
- [ ] Implement department navigation, product grids, sorting, contextual filters, result counts, and explicit loading/error/empty states.
- [ ] Verify browser cases at mobile and desktop sizes. Make filter controls keyboard accessible and preserve focus when drawers close.

## Task 5: CMS sections, settings, ImageKit, and Embla

**Files:** src/features/content/sections.ts, src/features/content/content.server.ts, src/features/content/PageSections.tsx, src/components/Carousel.tsx, src/features/content/imagekit.ts, src/server/media-upload.ts, tests/content/sections.test.ts, tests/e2e/carousel.spec.ts.

**Interfaces:** getPage(slug: string, department?: string): Promise<PageContent | null>; getPublicSettings(): Promise<PublicSettings>; imageUrl(asset: MediaAsset, preset: ImagePreset): string. PageContent contains a discriminated union of approved section types.

- [ ] Write tests for empty/unknown section types, public-settings allowlisting, ImageKit URL encoding, publication schedules, and an empty carousel.
- [ ] Implement approved section renderers and CMS presentation presets. Unknown content cannot execute arbitrary HTML or JavaScript; rich text must use a safe rendering policy.
- [ ] Implement a shared Embla wrapper with manual defaults, labelled controls, keyboard/focus behaviour, and pause/reduced-motion handling when autoplay is enabled.
- [ ] Implement staff-authorised upload handling with file size/type validation and protected credentials. Use ImageKit for public catalogue assets only; receipt storage is outside this task.
- [ ] Verify responsive image dimensions, gallery/product-rail interaction, and static presentation when all items fit. Run focused unit and browser tests.

## Task 6: Product selection and shared cart

**Files:** src/routes/products/$slug.tsx, src/features/catalogue/VariantSelector.tsx, src/features/catalogue/variant-selection.ts, src/features/cart/cart.ts, src/features/cart/CartPanel.tsx, tests/cart/cart.test.ts, tests/e2e/product-cart.spec.ts.

**Interfaces:** resolveVariant(product: ProductDetail, selection: Record<string,string>): Variant | null; addCartLine(cart: Cart, sku: string, quantity: number): Cart. Cart lines store SKU and positive integer quantity; display data is reloaded, not treated as checkout authority.

- [ ] Test invalid option combinations, a single default variant, duplicate SKU additions, invalid quantities, and stale persisted cart versions.
- [ ] Implement product detail sections by product type, media gallery, option availability, and distinct similar/complementary product groups.
- [ ] Implement the shared cart with safe browser-only persistence and hydration behaviour. Department changes do not clear it.
- [ ] Verify add/update/remove and reload behaviour in browser tests. Preview checkout must clearly indicate orders are not being accepted until the commerce subsystem is ready.

## Task 7: Supplier applications and staff review

**Files:** src/routes/sell.tsx, src/features/suppliers/schema.ts, src/features/suppliers/applications.server.ts, directus/schema/suppliers.ts, tests/suppliers/applications.test.ts, tests/e2e/supplier-application.spec.ts.

**Interfaces:** submitSupplierApplication(input: SupplierApplicationInput, idempotencyKey: string): Promise<{ reference: string }>. Input contains business name, contact name, email, phone, category interests, optional catalogue/website link, message, and privacy acknowledgement.

- [ ] Test required fields, link validation, repeated identical submission, mismatched reuse of an idempotency key, and public denial of list/read operations.
- [ ] Implement validation, submission abuse controls, idempotent storage, and a receipt reference. Do not introduce sensitive document uploads in this task.
- [ ] Configure staff-only ownership, notes, status transitions, and review history. Acceptance does not create supplier login or publish catalogue items.
- [ ] Verify form errors, submission success, retry behaviour, and staff/public permissions. Email delivery remains a separate provider integration and must not fabricate a sent acknowledgement.

## Task 8: Foundation acceptance and next-stage handoff

**Files:** tests/e2e/foundation.spec.ts, docs/foundation-validation.md, docs/commerce-provider-checklist.md.

- [ ] Run `npm run typecheck`, `npm run test`, `npm run build`, and `npm run test:e2e`. Investigate failures before claiming completion.
- [ ] Validate actual SSR, metadata, server-only boundaries, responsive behaviour, keyboard/focus interactions, and permission checks on an authorised preview target.
- [ ] Document implemented features, remaining visual review, and explicit checkout limitations. No real supplier information should be used in automated tests.
- [ ] Prepare a separate transactional-commerce spec/plan covering both launch channels, a staff order-entry workflow, shared verified customer identity, location-aware stock/reservations, phone verification, deposits, private receipts, payments/allocations, invoices/credit notes/PDFs, shipment events, RTO inspection, notification retries, and reconciliation. Include cross-channel last-unit concurrency, duplicate staff submissions, authorisation, and financial adjustment tests. Do not enable order-table edits that bypass these services.
- [ ] Confirm provider onboarding and the policy decisions in the design before implementing real transactional integrations. Fresh GitHub repository creation and publication remain a later user-directed step.

## Execution handoff

This plan deliberately covers the foundation only. Checkout/payment, inventory/fulfilment, customer identity, and notifications need their own plans because they have independent operational and provider dependencies. Recommended execution: native work in this chat, task by task, with review before production use. The user may instead select subagent-driven execution.
