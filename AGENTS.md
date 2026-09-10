# AGENTS.md

## Repo
- Google AI Studio applet: **The Avenue Thirty** (multi-category store: skincare, bags, jewellery, accessories, toys).
- Vite + React 19 + TypeScript SPA served by an Express dev server (`server.ts:3000`).
- Catalog is static in `src/data/mockData.ts`. No HubSpot API integration at runtime.

## Commands
- `npm run dev` — starts Express + Vite middleware (port 3000). Not plain `vite`.
- `npm run build` — `vite build` + esbuild bundles `server.ts` to `dist/server.cjs`.
- `npm run start` — runs bundled server.
- `npm run lint` — **only** `tsc --noEmit`. No ESLint/Prettier configured.
- No test runner configured.

## Env / AI Studio
- Required: `GROQ_API_KEY` (injected by AI Studio at runtime).
- Optional: `APP_URL` (injected by AI Studio).
- `DISABLE_HMR=true` disables HMR and file watching to prevent flickering during agent edits (`vite.config.ts`). Do not remove this logic.
- `VITE_CIRCLE_SELLER_TOKEN` / `VITE_CIRCLE_CATALOGUE_URL` — static catalog reference for WhatsApp order attribution.
- `.env` is for secrets only. Non-sensitive store settings live in `src/config/shop.ts`.

## Architecture
- Entry: `src/main.tsx` → `src/App.tsx`.
- `App.tsx` holds all global state (cart, modals, chat, currentCategory) and wires sections.
- Components: `src/components/`. Types: `src/types.ts`. Mock data: `src/data/mockData.ts`.
- Store config: `src/config/shop.ts` (`SHOP_CONFIG`) for non-sensitive operational settings.
- Category taxonomy is defined in `src/utils/category.ts` — 5 HubSpot-aligned keys: `clothing_apparel`, `skincare_beauty`, `bags_backpacks`, `accessories`, `toys_kids`.
- `Header.tsx` top nav renders category buttons as direct links (dropdowns are flattened but preserved as commented JSX for future re-enable).
- `CategoryPage.tsx` renders a filtered `ProductGrid` for the selected category. Navigation is state-based via `currentCategory` in `App.tsx`.
- API: `POST /api/chat` in `server.ts` calls GROQ (`openai/gpt-oss-20b`) with a product catalog system prompt.
- Build output: `dist/` (client + bundled server).

## Toolchain Quirks
- Tailwind v4 via `@tailwindcss/vite` — no PostCSS config.
- Path alias `@` → project root in `tsconfig.json` and `vite.config.ts`.
- Lenis smooth scroll initialized in `App.tsx` `useEffect`.
- `bun.lock` present but scripts are npm-compatible.

## Checkout Flow
- Guest checkout is COD-only, completed via a pre-populated `wa.me` link in `CartDrawer.tsx`.
- `src/utils/whatsapp.ts` builds the WhatsApp URL from cart + delivery details. Embeds the Circle Baji seller catalog link.
