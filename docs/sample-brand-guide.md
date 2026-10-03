# Sample brand journey guide

These records are development examples, not real supplier approval, inventory or merchandise offers.

## Follow the CMS pattern

1. [Supplier application](https://admin.theavenuethirty.com/admin/content/supplier_applications/12e93359-fdd2-4ae2-ab25-92c63b713101): a fictitious application progresses received, under review, accepted. Directus revisions record the sample status changes. Staff notes identify the brand record.
2. [Polo Ralph Lauren (Sample)](https://admin.theavenuethirty.com/admin/content/brands/95a0c092-8b4e-492d-af04-1aae2531425c): shared brand identity. The description links it to the onboarding application and Ounass reference. No genuine partnership is asserted.
3. [Men department](https://admin.theavenuethirty.com/admin/content/departments/02ffebcf-f912-40a4-ae5f-ca244bd40b28): a shopping destination, independent from product category/type.
4. [Clothing](https://admin.theavenuethirty.com/admin/content/categories/98a10f2d-249c-4129-a6c3-9a2da249aa48) > [Shirts](https://admin.theavenuethirty.com/admin/content/categories/136a2996-23db-4dd0-aba6-55f8b79e980d) and [Accessories](https://admin.theavenuethirty.com/admin/content/categories/bcb30b3e-c8ed-49f7-ad18-bb30f4d6d573) > [Caps](https://admin.theavenuethirty.com/admin/content/categories/4fd8cfcf-4025-4ef1-a9f1-029bd9bfda8c): global category hierarchy. The brand's offered categories come from its products.
5. [Sample cotton Oxford shirt](https://admin.theavenuethirty.com/admin/content/products/fcf4edab-4d2a-43dd-a73d-87b0ef177988): shared description, brand, category/type, specifications, department, media and variants.
6. [Sample cotton cap](https://admin.theavenuethirty.com/admin/content/products/4c9c053e-0cdb-4b3b-a0be-554b23082393): simple product with one default SKU. Its one-size sizing belongs in specifications.
7. [Sample brand edit](https://admin.theavenuethirty.com/admin/content/collections/54193400-c839-4e31-a793-fd618903fd59), [Men landing page](https://admin.theavenuethirty.com/admin/content/pages/3c704191-5db0-476d-a2d6-272a43b41cb6) and [Men navigation](https://admin.theavenuethirty.com/admin/content/navigation_menus/a3ebbb7e-3711-4c1d-a371-9188c13ddade): merchandising is authored separately from classification.

Product editor aliases expose variants, options, departments, media and specifications. Page editor aliases expose sections. Prices are integer minor units: 1,250,000 equals PKR 12,500; 450,000 equals PKR 4,500. All sample prices are invented.

## Opening stock

These opening quantities are persisted in the sample warehouse. Current reservations and availability are shown below.

| SKU | Opening quantity | Price |
| --- | ---: | ---: |
| SAMPLE-PRL-SHIRT-NAVY-S | 5 | PKR 12,500 |
| SAMPLE-PRL-SHIRT-NAVY-M | 3 | PKR 12,500 |
| SAMPLE-PRL-SHIRT-WHITE-S | 1 | PKR 12,500 |
| SAMPLE-PRL-SHIRT-WHITE-M | 0 | PKR 12,500 |
| SAMPLE-PRL-CAP-DEFAULT | 8 | PKR 4,500 |

Available stock is on hand minus reserved. The catalogue availability flag follows stock changes; the order transaction checks actual balances. White M is unavailable.

## Test browsing

- [Men department](http://127.0.0.1:3002/men)
- [Shirt detail](http://127.0.0.1:3002/products/sample-cotton-oxford-shirt)
- [Cap detail](http://127.0.0.1:3002/products/sample-cotton-cap)

Use the live Directus commerce preview on port 3002. Port 3000 uses independent local fixtures. Selecting Navy/S on the shirt enables add to bag. The cap needs no option selection. Department and category browsing reuse the same SKU. Development checkout now accepts test COD orders. Production and fixture checkout remain closed.

Original sample illustrations are uploaded through the existing ImageKit account and linked via media_assets/product_media. They are clearly labelled development illustrations, not manufacturer photography.

## Source reference

The reference brand/category is [Polo Ralph Lauren on Ounass](https://www.ounass.ae/men/designers/polo-ralph-lauren). Product descriptions, local prices, variants and stock are independently authored demonstration data. This is not an import of Ounass stock or pricing.

## Development orders and inventory

The sample brand journey now includes persisted test COD orders and atomic stock reservations. No payment, notification or shipment is initiated. Phone numbers are unverified. These records do not represent real supplier contracts or merchandise.

- [DEV-100004: website](https://admin.theavenuethirty.com/admin/content/orders/d7be88ca-c71d-4d8f-a543-d1bb3b671bd0)
- [DEV-100018: staff_whatsapp](https://admin.theavenuethirty.com/admin/content/orders/fc972444-6c8e-4ab0-a2e9-86c96c358106)

Open each order to inspect its lines, address, reservations and events. Orders and inventory fields are read-only in CMS. The authenticated staff command currently supports Directus administrators; a staff order entry screen is a later step.

| SKU | On hand | Reserved | Available |
| --- | ---: | ---: | ---: |
| SAMPLE-PRL-CAP-DEFAULT | 8 | 1 | 7 |
| SAMPLE-PRL-SHIRT-NAVY-M | 3 | 1 | 2 |
| SAMPLE-PRL-SHIRT-NAVY-S | 5 | 0 | 5 |
| SAMPLE-PRL-SHIRT-WHITE-M | 0 | 0 | 0 |
| SAMPLE-PRL-SHIRT-WHITE-S | 1 | 0 | 1 |

Balances are recorded per variant and location. Reservation reduces available stock, while on-hand remains unchanged until fulfilment. Cancellation releases the reservation once. Repeat seeding never resets stock.

Local development checkout: http://127.0.0.1:3002/checkout. Production and fixture checkout remain disabled.

Staff command: `node --import tsx directus/staff-order.ts place input.json <idempotency-uuid>`. Configure a private `DIRECTUS_STAFF_TOKEN` for a Directus administrator. The input contains `channel` (`staff_phone` or `staff_whatsapp`) and `input` (name, phone, address, SKU lines). The actor is derived from the authenticated token. Cancellation: `node --import tsx directus/staff-order.ts cancel <order-uuid> confirm`.

Local TLS certificate verification is disabled only through the explicit development flag authorised by the user. Production refuses that flag and requires verified TLS.

## Staff screen and invoice previews

[Staff order workspace](http://127.0.0.1:3002/staff/orders) supports Directus administrator sign-in, WhatsApp/phone test orders through the shared command, recent orders and cancellation with reservation release. Administrator credentials are entered at sign-in; browser cookies contain only an opaque HttpOnly session identifier. Tokens remain server-side, sessions expire after 15 minutes, and current administrator authority is checked on every action. Development sessions are held in memory and end when the server restarts.

Pending order attempts retain the original idempotency key through reauthentication by the same account. Changing staff identity clears the prior account's customer details; inspect CMS before recreating a prior order. Explicit sign-out clears a saved attempt. This local development workflow requires an existing Directus administrator account. An authenticated browser login has not been tested using a real password, because no staff password is configured locally.

Each order has a private draft invoice preview and print action. Store settings contain The Avenue Thirty, Paris Road Street Number 4 (51310) Sialkot, Pakistan, and Pending setup for tax registration/treatment. Drafts use persisted order-line/address amounts, validate totals, assign no invoice number and issue no tax invoice. [Exported sample draft](../.local/sample-invoice-draft.pdf) contains fictitious sample customer details only.

The private notification_outbox CMS collection tracks transactional email events. Existing sample orders have no email and show awaiting_recipient. Resend accepted a separate message to its simulator address. Customer email delivery and Directus system SMTP have not been independently verified. See transactional-messages.md for delivery safeguards and remaining activation work.
