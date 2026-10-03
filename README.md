# The Avenue Thirty

Fresh TanStack Start storefront foundation for a single retailer with multiple brands.

## Local preview

Use Node 22.12 or newer, then:

```sh
npm ci
CATALOGUE_SOURCE=fixtures npm run dev
```

Open http://127.0.0.1:3000. Fixtures are explicitly fictitious and refused in production. Checkout is closed. The current layout and photography placeholders are provisional.

For real catalogue data, configure `DIRECTUS_URL` and a dedicated read-only `DIRECTUS_RUNTIME_TOKEN` using `.env.example`. Do not use the administrative token for runtime. Content failure is isolated from catalogue navigation. All data access crosses server-only modules.

## Validation

```sh
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Browser tests use the fixture development server at desktop and mobile widths. These checks do not prove live Directus permissions, production deployment, provider delivery, or transactional checkout.

## Directus

`npm run schema:plan` reads the configured instance, writes a timestamped protected snapshot and a local additive plan under `.local`. No live writes occur in planning mode. Review the plan and confirm the development target before applying. Existing field shape drift is not migrated automatically.

`directus/permissions.ts` declares separate catalogue, supplier-submission, and staff-review policies. The 25-collection development schema, 11 relational editor aliases, and scoped service accounts have been applied. Catalogue/supplier and staff-review permissions have been verified against the development instance. The staff review role remains unassigned to human staff. Public Directus access should remain closed. Supplier runtime credentials may read private applications for idempotency, so must never reach clients or share the catalogue token.

Supplier applications remain disabled unless a separate token and `SUPPLIER_APPLICATIONS_ENABLED=true` are configured. Before opening, verify the real create/read permissions, retention, staff review workflow, and deployment-level rate limiting. The local service has a durable daily email throttle, a honeypot, idempotent writes, and safe errors; it is not a comprehensive anti-bot system. No acknowledgement email is claimed or sent.

CMS supports plain-text hero/text/FAQ sections, curated product rails, brand rails, publication schedules, internal navigation, and public settings. Department landing content uses a page slug such as `women-home` with the matching department. All carousels are manual. ImageKit delivery URLs are implemented; staff-authorised media uploads remain pending.

See `docs/implementation-progress.md` for remaining work and `docs/commerce-next-stage.md` for the transactional design boundary. The project is published to avenuethirty/theavenuethirty-storefront. Hosted deployment remains pending.

## Development commerce and email

Development website and staff orders use atomic Postgres stock reservations. Private staff order entry and draft invoice previews are implemented. Checkout remains closed in production.

Resend order confirmation/cancellation sending and signed delivery tracking are verified in development. See [manual email deployment](docs/email-deployment.md) for Render setup. Directus SMTP remains separately unverified; customer sending and reliable hosted scheduling are not enabled.
