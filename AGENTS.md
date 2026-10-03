# The Avenue Thirty

Fresh TanStack Start application. Read docs/superpowers/specs/2026-10-03-storefront-foundation-design.md and the associated plan before changes.

- Node >=22.12, npm. Run npm test, npm run typecheck, npm run build.
- No em dashes in content, microcopy, or documentation.
- No paid service integrations without explicit user approval.
- Never expose, print, or commit .env credentials. Private modules use TanStack server-only protection.
- Runtime must use a scoped Directus token, never the administrative static token.
- Preserve the sibling .archive directory. Do not import legacy Google Sheets or HubSpot code.
- Fixtures are local development data only. No real orders until commerce acceptance passes.
- Store-wide SKU and customer identity; inventory is location-aware in the forthcoming commerce model.
- Do not push or create a remote repository unless explicitly requested.
