# AGENTS.md

## Repo

- Google AI Studio applet: **The Avenue Thirty** (multi-category store: skincare, bags, jewellery, accessories, toys).
- Vite 6 + React 19 + TypeScript 5.8 SPA served by an Express dev server (`server.ts` at repo root, port 3000). **Not** plain `vite`.
- Product data comes from a Google Sheets CSV at runtime (`GOOGLE_SHEET_CSV_URL`). `src/data/mockData.ts` has **empty arrays** — no products are hardcoded.

## Commands

| Command | What it actually does |
|---|---|
| `npm run dev` | `tsx server.ts` — Express server + Vite middleware, port 3000 |
| `npm run build` | `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` |
| `npm run start` | `node dist/server.cjs` — run bundled server (production) |
| `npm run preview` | `vite preview` — preview production build |
| `npm run clean` | `rm -rf dist server.js` |
| `npm run lint` | `tsc --noEmit` only. No ESLint/Prettier configured. |

No test runner, no test files, no CI config (no `.github/` workflows).

## Entry points & architecture

- **Client**: `src/main.tsx` → `src/App.tsx`. `App.tsx` holds all global state (cart, modals, chat, catalogue).
- **Server**: `server.ts` (repo root) — Express app with `/api/catalogue`, `/api/chat`, `/api/checkout`. `src/server/hubspot.ts` is only the HubSpot API module called by `server.ts`.
- **Routing** (BrowserRouter): `/`, `/product/:slug`, `/about`, `/contact`, `/faq`, `/privacy`. No `/category/*` route.
- **Components**: `src/components/` | **Pages**: `src/pages/` | **Types**: `src/types.ts` | **Config**: `src/config/shop.ts` | **Data**: `src/data/mockData.ts` | **Server modules**: `src/server/`

## Category taxonomy

Defined in `src/utils/category.ts` — 5 HubSpot-aligned keys: `clothing_apparel`, `skincare_beauty`, `bags_backpacks`, `accessories`, `toys_kids`.

**Important**: `clothing_apparel` is **commented out** in `SHOP_CONFIG.categories` (`src/config/shop.ts`) so it does not appear in nav, but it still exists in the `CategoryKey` type and `Product.category` type.

## Environment

- **Required**: `GROQ_API_KEY` — used by both `server.ts` (`process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY`) and the GROQ chat API.
- **Critical for catalogue**: `GOOGLE_SHEET_CSV_URL` — `server.ts` fetches product data from this Google Sheets CSV export. Missing → catalogue falls back to empty array or stale cache (10-min TTL). **Not listed in `.env.example`** but present in `.env`/`.env.local`.
- `HUBSPOT_ACCESS_TOKEN` — checkout sync (creates contact + deal + association via HubSpot CRM API).
- `DISABLE_HMR=true` — disables Vite HMR and file watching in `vite.config.ts`. **Do not remove** — prevents flickering during agent edits.
- `APP_URL` — optional, injected by AI Studio.
- `.env` and `.env.local` contain secrets (including a real GROQ key and HubSpot token) — do not expose these. `.env.example` is tracked in git.
- Non-sensitive store settings live in `src/config/shop.ts` (`SHOP_CONFIG`).

## Toolchain quirksks

- **Tailwind v4** via `@tailwindcss/vite` plugin — no PostCSS config. CSS entry: `src/index.css` with `@import "tailwindcss"`.
- **No PostCSS** — `autoprefixer` is in `package.json` but unused.
- Path alias `@` → project root (in both `tsconfig.json` and `vite.config.ts`).
- Lenis smooth scroll initialized in `App.tsx` `useEffect` (duration 1.2, custom easing).
- `bun.lock` present but scripts are npm-compatible — use `npm`, not `bun`.
- TypeScript: `moduleResolution: "bundler"`, `isolatedModules: true`, `noEmit: true`, `allowImportingTsExtensions: true`.

## Checkout flow

- Guest checkout is COD-only. Completed via a pre-populated `wa.me` link generated in `CartDrawer.tsx`.
- `src/utils/whatsapp.ts` builds the WhatsApp URL from cart items + delivery details.
- On confirm, `CartDrawer` POSTs to `/api/checkout`, which calls `createHubspotDeal()` (`src/server/hubspot.ts`) → creates HubSpot contact, deal, and association.
- Shipping: `defaultFee: 240` PKR, `freeShippingThreshold: 5000` PKR (`src/config/shop.ts`).

## Build output

`dist/` contains: `index.html`, `assets/` (client bundles), `server.cjs` + `server.cjs.map` (bundled Express server).

## Vercel deployment

- Vercel does not support a long-running Express process. Instead, `server.ts` is wrapped as a single serverless function via `api/index.ts`.
- `vercel.json` routes `/api/*` to the serverless function at `api/index.ts` and all other routes to `/index.html` (SPA entry). `api/index.ts` imports the Express app from `server.ts`; `vercel.json` includes `server.ts` in the function bundle so the import resolves at runtime.
- `server.ts` exports `createApp()` (returns the Express app). The `app.listen()` call is guarded by an ESM main-module check so it does not fire when imported by Vercel's runtime.
- Local dev (`npm run dev`) is unaffected — it still runs `tsx server.ts` directly.
- Vercel Dashboard env vars must include: `GROQ_API_KEY`, `HUBSPOT_ACCESS_TOKEN`, `GOOGLE_SHEET_CSV_URL`. Do not set removed `VITE_CIRCLE_*` vars.
- Trade-off: the in-memory catalogue cache is lost on serverless cold starts. First request after idle refetches the Google Sheet (~1–2s).
