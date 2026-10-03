# The Avenue Thirty: storefront foundation

Status: foundation direction accepted in conversation; Pakistan commerce refinements below are proposed for review before implementation.
Date: 2026-10-03

## Purpose and agreed direction

Build a new premium department store with a contemporary minimal customer experience. This is one retailer selling multiple brands. The Avenue Thirty controls listings, prices, orders, customer service, and fulfilment. Suppliers apply to partner with the retailer; they do not independently operate storefronts or manage customer orders.

The existing repository is a disposable reference, not a live store requiring migration compatibility. Its code, URLs, design, Google Sheets integration, and HubSpot integration are not requirements. Preserve the existing checkout in Git history and protect local credentials when eventually replacing implementation files. Do not import the old catalogue unless separately requested.

Agreed technology direction:

- TanStack Start with React for the new storefront and its server entry points.
- Directus at admin.theavenuethirty.com for staff administration and structured content.
- Supabase Postgres for persistent data behind Directus.
- ImageKit for media storage and delivery.
- Embla as the shared carousel implementation wherever carousels are appropriate.

Ounass is a public experience benchmark, not an assertion about its internal architecture. Shopify is a reference for understandable product and operational administration. Neither reference means every feature is automatically in release scope.

All authored copy, microcopy, and documents must avoid em dashes. The brand voice is direct, calm, informative, and professional. Claims about authenticity, delivery guarantees, and warranties must reflect actual operations.

## Delivery boundary

Approve and implement the foundation as the first bounded project. Subsequent projects cover transactional commerce and launch readiness. Design the relationships between them now, but do not represent working product browsing as a complete commerce launch.

Foundation scope:

1. New TanStack Start application, shared design tokens, accessible responsive shell, and server-only data boundaries.
2. Directus catalogue, department, content, navigation, media-reference, and store-settings structures.
3. Department landing pages, product lists, product detail pages, contextual filters, variant selection, and a shared cart interface.
4. Supplier application journey and staff review records.
5. Preview deployment and documented validation against representative catalogue fixtures.

Transactional commerce scope after operational decisions are confirmed:

- Customer identity and guest checkout.
- Server-authoritative checkout, order creation, stock reservation, fulfilment, cancellations, and returns.
- Transactional notifications, payment integration if selected, order confirmation, and order tracking.
- Operational staff permissions, monitoring, recovery procedures, and launch checks.

Any preview without transactional order processing must be clearly non-production and must not accept real orders.

## Store structure

Departments are configurable top-level shopping destinations. Women, Men, and Kids illustrate the interaction, not a fixed launch taxonomy. Each department has its own URL, navigation, landing page, campaigns, and merchandising. The URL is the source of truth for the active department. Direct links and browser history must preserve context.

Account, cart, and wishlist are store-wide. Changing departments must not reset them. A product can appear in more than one department without duplicating its identity or inventory. Product URLs should have one deliberate canonical identity even when the product is discovered in several departments.

Distinguish:

- Department: a shopping destination and navigation context.
- Category: hierarchical classification for discovery.
- Product type: attribute and option definitions for an item class.
- Brand: manufacturer or label identity and brand content.
- Collection: curated or rule-based merchandising membership.

Navigation is authored separately from the catalogue hierarchy. An editor can feature a brand or collection without restructuring product classifications.

## Catalogue model

Products own shared descriptions, brand, publication state, SEO metadata, category membership, and ordered media. Variants represent purchasable units with unique SKUs, option combinations, prices, availability policy, and inventory identity. A simple product has one default variant.

Product options such as size, colour, or storage are distinct from descriptive attributes such as material or screen size. Use typed attribute definitions and controlled values where filtering requires consistency. Product types declare applicable attributes, filters, option rules, and detail-page sections. Do not rely on arbitrary unvalidated JSON for searchable catalogue properties.

Proposed relational groups:

- departments, categories, product_types, brands, products, product_variants
- attribute_definitions, attribute_values, product_attribute_values
- product_options, option_values, variant_option_values
- collections and membership/rule records
- media_assets and ordered product/variant media associations
- navigation_menus, navigation_items, pages, page_sections, store_settings
- supplier_applications and staff review history

Exact fields and indexes belong in the implementation plan after schema review. Invariants include unique SKUs, unique option combinations within a product, valid monetary values, deterministic default variants, and explicit publication rules. Draft records must not leak through public lists, search, direct product URLs, feeds, or recommendations.

Stock is separate from editorial publication. Sold-out products may remain visible according to the agreed merchandising policy. An invalid option combination cannot be selected or added to cart. A multi-option product requires a valid selection before purchase; quick add must open selection when necessary.

## Shopping experience

The shared visual language uses restrained colour, clear typography, subtle borders, consistent spacing, and product-led imagery. Concrete font families, colours, logos, and art direction remain a visual-design review step rather than invented brand decisions.

Product lists provide relevant filters, sorting, clear prices, availability cues, and intentional empty/loading/error states. Filter and sort state is shareable in the URL. Counts must follow an agreed faceting rule and remain consistent with results. Filter by purchasable variant combinations where applicable, rather than implying a size and colour combination exists when it does not.

Product detail templates share structure while rendering category-specific information: size and fit, specifications, dimensions, warranty, or delivery requirements. Related alternatives and complementary items are separate recommendation concepts, with rule-based defaults and staff overrides. No machine-learning recommendation system is required for the foundation.

Cart lines identify a variant and quantity. Browser cart state is a convenience, not authority for price or available stock. Persist cart state across department navigation; future checkout must revalidate every line on the server.

## Content, settings, and media

Directus is the initial staff interface. A custom Shopify-like admin application is not implied by the choice of familiar workflows. Configure suitable collection layouts, field help, validation, relations, roles, and permissions; propose custom interfaces only when a concrete workflow needs them.

Separate global settings, authored pages, merchandising, and commerce records. Public store configuration must exclude credentials and private operational fields. Protected service credentials remain in server configuration, not public settings collections.

Pages use approved section types, such as campaign hero, rich text, image/text, category tiles, product rail, brand rail, and FAQ. Editors control content and ordering within defined layouts. Rich content must be safely rendered. Preview and publishing behaviour must be designed before production editing is enabled.

Media references should retain ImageKit asset identity/path, alt text, dimensions, and ordering. Store reusable source assets and generate delivery transformations centrally. Upload credentials remain server-side. Define upload permissions, file validation, and reference-aware deletion before enabling uploads. Responsive image variants and reserved image dimensions should limit unnecessary downloads and layout movement.

## Carousels

Use shared Embla-based components for product rails, galleries, brand rails, and campaign slideshows. CMS fields expose approved presets, content source, headings, item limits, responsive presentation, controls, and publication scheduling. Do not expose arbitrary library configuration or JavaScript.

Product rails and galleries default to manual navigation. Campaign autoplay, if enabled, has visible pause controls, appropriate focus/interaction handling, and reduced-motion support. Controls are keyboard accessible and clearly labelled. Static layouts remain available when all items fit or a carousel is unnecessary.

## Supplier applications

The public Sell on The Avenue Thirty journey explains the partnership model, collects relevant business and catalogue information, and confirms receipt. Proposed minimum fields are business/brand name, contact name, business email, phone, website or catalogue link, product categories, and partnership message. Exact required fields and privacy copy need review before publication.

Start with catalogue links rather than sensitive document uploads. Staff review applications in Directus, assign responsibility, record internal notes, and progress an explicit status such as received, under review, further information needed, accepted, or declined. Acceptance does not publish products or grant supplier access.

Submissions need validation, abuse protection, duplicate handling, and public responses that expose no other applicant data. A saved application remains successful even if its acknowledgement email requires retry. Retention and any document-verification requirements must be settled before collecting sensitive business records.

## Server and commerce boundaries

TanStack Start server functions/routes call a server-only service layer. Use a least-privilege Directus service identity for runtime access; the tested administrative token is not automatically the production storefront credential. Explicit server-only imports protect secrets because route loaders may also run in the browser.

Separate catalogue queries, pricing, inventory, orders, and notifications by responsibility. The storefront must not send arbitrary Directus mutations or accept client-supplied prices as authoritative. Public catalogue reads and private customer/order reads require distinct access policies and caching rules.

The commerce design must define a single transaction boundary for order creation and stock allocation. Several independent REST writes are not an atomic order transaction. Choose a Directus custom endpoint or a carefully scoped database transaction service after reviewing deployment access and ownership. Keep price and stock rules in one authoritative implementation.

Order submission must be idempotent. Orders retain immutable purchase-time line descriptions, SKUs, quantities, prices, currency, and address snapshots. Confirmation appears only after a durable order exists. Payment, order, and fulfilment states are distinct. Notifications require durable retry handling and must not determine whether an order exists.

## Cache and infrastructure decisions

Do not carry the old Vercel KV proposal forward automatically. Select hosting, cache storage, refresh behaviour, and observability after confirming catalogue size and deployment needs. Public catalogue caching may tolerate bounded staleness; checkout must validate against authoritative price and stock. Invalidation must cover variants, relationships, settings, media, and merchandising changes, not only product edits.

Existing Directus connectivity is verified. Its hosting, backups, deployment pipeline, schema migration process, and operational permissions have not been audited. Supabase usage does not automatically select Supabase Auth for customers.

## Decisions required before transactional implementation

These do not block agreeing on the foundation, but must be resolved before implementing the affected capability:

| Decision | Affected capability |
| --- | --- |
| Launch countries, currency, language, and tax treatment | Pricing, address forms, localisation, totals |
| COD, online payment, or both, plus provider | Payment states, checkout, refunds |
| Stock ownership, locations, reservation policy, backorders | Inventory, availability, fulfilment |
| Shipping zones, carriers, rates, promises, installation | Delivery quotes, tracking, split shipments |
| Guest checkout and customer authentication method | Sessions, order access, account management |
| Email provider, sender domain, templates | Confirmations and transactional notifications |
| Cancellation, return, and warranty policies | Staff workflows and customer self-service |
| Approved brand assets and visual design | Production UI and content |
| Launch catalogue and content source | Taxonomy validation, representative data, publication |

## Verification and acceptance

Foundation acceptance requires:

- Real server-rendered department and product routes with correct metadata and explicit empty/error handling.
- Department switching preserves cart and account context; direct URLs select the correct department.
- Representative clothing, phone, and appliance fixtures prove different filters, attributes, and variants without separate hardcoded category implementations.
- Draft and private data remain inaccessible through public queries and direct URLs.
- Valid variant selection, stable SKU identity, and correct cross-department product reuse.
- CMS editing updates approved content and settings predictably.
- Supplier application save/read permissions, validation, staff review, and submission error handling are verified.
- Secret scanning of client output; no private Directus or ImageKit credentials in browser assets.
- Keyboard, focus, reduced-motion, responsive, and basic screen-reader checks across the main shopping journey.
- Unit/integration coverage for catalogue rules and permission boundaries, plus browser tests for department navigation, filtering, variant selection, and cart persistence.

Transactional acceptance additionally requires concurrent stock tests, repeated checkout submission tests, server-validated totals, durable order confirmation, notification retries, authorised order access, and cancellation/return stock reconciliation according to the agreed policies.

Build/type checks alone are insufficient. A preview deployment must verify server behaviour and the actual hosting adapter before launch.

## Pakistan commerce requirements and refinements

The user selected Pakistan as the operating context, COD plus prepaid options, manual transfer review, phone-led customer access, courier integration, and stock protection. Percentages and provider service claims supplied in conversation are planning assumptions, not verified market facts or promises to customers.

Payments:

- Support COD, prepaid gateway payments, and manual bank/wallet transfer as distinct flows. Select one initial gateway after confirming merchant eligibility, supported payment methods, credentials, sandbox access, refunds, and webhook verification. Raast support does not automatically imply support for every wallet or card method.
- A configurable COD deposit may be requested. The exact amount or percentage is an explicit launch decision. Record the verified deposit and remaining amount due to the courier so the customer is not charged twice.
- Model payment attempts and received amounts separately from the order state. Include pending, pending_verification, partially_paid, paid, failed, and refund outcomes as appropriate. A receipt upload or successful browser redirect is not proof of payment.
- Manual receipts are private evidence, with restricted staff/customer access, upload limits, validated file types, and review history. Do not put receipts on a publicly readable ImageKit delivery path. Private storage choice must precede this feature.
- Unpaid manual-transfer orders expire after 24 hours from creation. Proposed exception: a receipt submitted before the deadline moves to pending_verification and needs an explicit staff review deadline rather than cancellation while staff are reviewing it. User must approve this exception and review deadline. Late payment after expiry requires reconciliation, not automatic stock reallocation.

Identity:

- Use stable customer UUIDs and a normalised, verified E.164 phone as the primary login identifier. Phone changes require reverification and safe account-recovery rules. Email is optional unless a selected workflow requires it.
- Prefer provider-managed OTP with six digits, single-use verification, expiry, request/attempt rate limits, and non-enumerating responses. Six digits is a proposed refinement to the user's four-digit example. Confirm Pakistan SMS/WhatsApp delivery and business onboarding before provider selection.
- Guest verification and persistent account login are different actions. A deposit may satisfy a COD review policy but never sets phone_verified or grants access to an account or previous orders. Provider failure must not silently bypass account authentication.
- Derive delivery-success metrics from events. A restriction decision includes reason, staff audit, and review, rather than an unexplained permanent blacklist flag.

Inventory:

- At order creation, atomically reserve quantity, reducing available-to-sell stock immediately. Track on_hand and reserved separately, with available = on_hand - reserved for ordinary stock. This meets the user's no-overselling intent without treating reserved units as already shipped.
- On dispatch, decrement on_hand and release the matching reservation in the same transaction. On cancellation or expiry before dispatch, release the reservation exactly once.
- RTO begins as an in-transit return. Restock only once after physical receipt and a sellable-condition check; damaged returns go to a separate disposition. Courier status alone must not restock units.
- Preorders and backorders require explicit eligibility and an estimated dispatch/delivery range. Display 24-hour dispatch or 7-10 working-day delivery only when the item's actual fulfilment policy supports those promises.

Shipping:

- Use shipment records related to orders, each with provider, tracking number, tracking URL, line quantities, booking identity, and shipment status. This accommodates multiple parcels and future split shipments without changing order identity.
- Start with manually entered bookings/tracking as an operational fallback. Automate one courier after merchant/API access and webhook authenticity are verified. Courier settlement and COD cash reconciliation are distinct from delivery status.
- Trigger notifications from durable transitions with deduplication and retry tracking. Creating a label is not the same as dispatch or delivery.

Sources checked during planning:

- https://www.twilio.com/docs/verify/developer-best-practices
- https://www.twilio.com/docs/verify/api/programmable-rate-limits
- https://github.com/getsafepay/raast-docs/blob/main/guides/webhooks-delivery.mdx

Workspace reset: the original project including Git history and credentials was moved intact to ../.archive/2026-10-03-original-storefront. The fresh working directory retains a protected .env and these documents. No fresh GitHub repository has been created and no external schema changes have been made.

## Agreed launch channels and omnichannel readiness

Launch supports Website and staff-entered WhatsApp/phone orders. Physical pop-ups, retail POS, and additional external channels are Phase 2. Omnichannel-ready describes the underlying model, not completed external integrations or automatic future synchronisation.

Both launch channels must use the same authoritative pricing, order creation, reservation, payment, invoice, cancellation, and fulfilment services. Directus staff actions must call these services rather than bypassing them through unrestricted order-table edits. Draft staff orders do not reserve stock; explicit submission validates totals and atomically creates reservations. The exact staff screen belongs in the commerce plan.

Record a stable channel identifier and originating staff actor where applicable. Website, WhatsApp, and phone have distinguishable origins even though the latter two share the staff workflow. Customer records are store-wide; do not create a different customer per channel. Staff entering a number does not prove phone ownership or set verified status. Linking existing accounts and accessing purchase history requires an explicit staff permission policy.

Inventory is location-aware from the first commerce schema: locations, inventory balances by variant/location, reservations with order-line allocations, and auditable stock movements. Begin with the actual launch warehouse configuration. Avoid placing the sole stock balance on product_variants. Future transfers, additional warehouses, and POS adapters must use the same stock rules. Offline POS conflict resolution and synchronisation remain Phase 2 design work.

Financial records are shared across channels: orders, order-line snapshots, payment attempts/receipts, payment allocations, refunds, invoices, invoice lines, and credit notes. Separate order, payment, shipment, and invoice identities. Invoice issuance captures immutable amounts and billing/business details; invoice corrections use documented adjustments or credit notes rather than silent historical edits. Provide authorised PDF/print access and configurable business details, numbering, and terms. Confirm tax requirements and issuance timing before implementing compliance-sensitive behaviour.

Launch commerce acceptance includes concurrent website/staff purchases of the last available unit, duplicate staff submissions, staff authorisation and audit trails, correct channel attribution, shared customer identity without unverified account linking, consistent invoices across channels, and exactly-once reservation/payment adjustments.

Prefer open-source, self-hosted, and local providers. Obtain explicit user approval before integrating any paid service, after explaining purpose, expected costs, and alternatives. Credentials or provider discussion alone do not authorise an integration. Twilio documentation was consulted for OTP considerations only; Twilio is not selected or approved.

## Next review

Review this foundation scope and the separation of foundation work from transactional commerce. After approval, produce a detailed implementation plan with file/module boundaries, schema changes, verification steps, and sequencing. Begin product implementation only after that plan is reviewed and execution is authorised.
