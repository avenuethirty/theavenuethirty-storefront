# Header Location Selector

## Goal
Add a "Deliver to (City)" selector to the header (before the cart icon) that auto-detects the user's city via BigDataCloud IP geolocation, persists the selection in `localStorage`, and prefills the checkout form in `CartDrawer`.

## Decisions

- **Placement:** Header pill, before the cart icon, on both mobile and desktop.
- **States:** Auto-detected (`📍 Deliver to: Sialkot 51310 ▾`), fallback (`📍 Deliver to: Select Location ▾`).
- **Detection:** Silent on first visit via BigDataCloud IP geolocation (`/data/ip-geolocation-client?key=...`). No modal forced on first load.
- **Persistence:** `localStorage` with city + postalCode + lastDetected timestamp. Re-detection throttled to 24h.
- **Manual override:** `LocationModal` with Detect button, search input, and popular cities grid.
- **Checkout prefill:** CartDrawer city dropdown and new postalCode field pre-filled from location context.
- **API key:** `VITE_BDC_API_KEY` in `.env` (not tracked), placeholder in `.env.example`.
- **Cities source:** Static `pakistanCities.ts` array (shared between modal and CartDrawer), with postal code hints.

## Verified Context

- `src/components/Header.tsx` — mobile/desktop split. Right side on desktop: `Sell on Avenue 30` link + cart button. Location pill goes before the cart button.
- `src/components/CartDrawer.tsx` — has `PAKISTANI_CITIES` array and a City `<select>` in the delivery form. `guest.city` drives the checkout form + WhatsApp link.
- `src/utils/whatsapp.ts` — defines its own `GuestDetails` interface (duplicated from `src/types.ts`). Builds the WhatsApp message including `Address: ..., ${guest.city}`.
- `src/types.ts` — canonical `GuestDetails` has `fullName`, `phone`, `address`, `city`, `notes?`.
- `.env.example` — tracks `GROQ_API_KEY`, `APP_URL`, `HUBSPOT_ACCESS_TOKEN` placeholders. Needs `VITE_BDC_API_KEY`.

## Architecture

```
src/
  context/
    LocationContext.tsx   — context + provider + useLocation hook
  components/
    LocationModal.tsx     — detect / search / popular cities / save
  utils/
    pakistanCities.ts     — static cities array with postalCode hints
  types.ts                — add postalCode?: string to GuestDetails
  utils/whatsapp.ts       — import GuestDetails from ../types (remove duplicate)
  components/
    Header.tsx            — location pill before cart icon
    CartDrawer.tsx        — postal code field, prefilled from context
  App.tsx                 — wrap with LocationProvider
```

### Data flow

1. `App.tsx` wraps tree in `LocationProvider`.
2. Provider mounts → checks `localStorage` → if empty, silently calls BigDataCloud → saves result.
3. Header reads `location.city` from context → shows pill.
4. Pill click → opens `LocationModal`.
5. Modal actions → `detect()` / `setLocation(city, postalCode)` → updates context + localStorage.
6. CartDrawer reads `location.city` → pre-selects city dropdown. Adds postal code input pre-filled from `location.postalCode`.
7. On checkout submit, `guest.city` and `guest.postalCode` flow into `/api/checkout` payload and WhatsApp message.

### BigDataCloud response mapping

- `city` → matched against `pakistanCities.ts` list (case-insensitive). If no match, fall back to manual selection.
- `postalCode` → used if present; otherwise leave blank for manual entry.
- `region` / `countryName` → not stored (not needed for checkout).

## Tasks (ordered)

1. **`src/types.ts`** — Add `postalCode?: string` to `GuestDetails`.

2. **`src/utils/whatsapp.ts`** — Remove the local `GuestDetails` interface; import it from `../types`. Include `postalCode` in the WhatsApp message when present: `Address: ..., ${guest.city}${guest.postalCode ? `, ${guest.postalCode}` : ''}`.

3. **`src/utils/pakistanCities.ts`** — New file. Export `PAKISTAN_CITIES` as `Array<{ name: string; postalCode?: string }>` with the 18 cities currently in CartDrawer + postal code hints.

4. **`src/context/LocationContext.tsx`** — New file.
   - State: `{ city: string; postalCode?: string; isDetecting: boolean; error: string | null }`.
   - `detect()`: calls BigDataCloud with `VITE_BDC_API_KEY`, normalizes city against `pakistanCities`, saves to `localStorage` with timestamp.
   - `setLocation(city, postalCode?)`: manual set, saves to `localStorage`.
   - 24h throttle: only auto-detect if `lastDetected` is older than 24h.
   - `localStorage` keys: `ta30_location_city`, `ta30_location_postalCode`, `ta30_location_detectedAt`.

5. **`src/components/LocationModal.tsx`** — New file.
   - Props: `isOpen`, `onClose`.
   - Detect button → calls `useLocation().detect()`.
   - Search input → filters `pakistanCities` by name.
   - Popular cities grid → quick-select chips (first 6–8 cities).
   - Save → calls `setLocation`, closes modal.
   - Loading/error states.

6. **`src/components/Header.tsx`** — Add location pill before the cart icon on both mobile and desktop layouts.
   - Reads `location` from `useLocation()`.
   - Fallback text: "Select Location".
   - Click opens `LocationModal` (needs `onOpenLocation` prop from App).

7. **`src/components/CartDrawer.tsx`** — Import `pakistanCities` and `useLocation`.
   - Add postal code text input below city select.
   - Prefill `guest.city` and `guest.postalCode` from context when drawer opens / slide changes to delivery.

8. **`src/App.tsx`** — Import `LocationProvider` from `../context/LocationContext`. Add `onOpenLocation` state + handler. Wrap return in `<LocationProvider>`. Pass `onOpenLocation` to `Header`.

9. **`.env.example`** — Add `VITE_BDC_API_KEY="YOUR_BDC_API_KEY"` placeholder.

## Validation

1. `npm run lint` + `npm run build` clean.
2. `npm run dev`:
   - Header shows location pill on both mobile and desktop, before cart icon.
   - First visit: silent auto-detect populates city within ~1s.
   - Clicking pill opens LocationModal; Detect, search, and popular-city selection all work.
   - Selection persists across page refreshes (localStorage).
   - Re-detection throttled (24h cache).
   - CartDrawer city dropdown pre-selected with saved city; postal code field pre-filled.
   - Checkout confirm → WhatsApp message includes city + postal code.
   - Static routes unaffected.

## Risks / Edge Cases

- **IP geolocation mismatch:** BigDataCloud may resolve to a nearby major city instead of the user's actual city. Manual override + popular cities grid mitigates this.
- **API quota:** Free tier is 10k req/month. 24h throttle + localStorage persistence keeps actual calls low.
- **CORS failure:** If BigDataCloud changes CORS policy, the client-side call will fail. The fallback is manual selection — no hard dependency.
- **City name mismatch:** API may return alternate spellings. Normalization against `pakistanCities.ts` list handles known cities; unknowns fall back to manual entry.
- **Postal code absence:** BigDataCloud does not reliably return postal codes for Pakistani cities. Field stays blank for manual entry; default hints in `pakistanCities.ts` cover major cities.

## Out of Scope

- Server-side proxy for geolocation.
- Address autocomplete.
- Multiple saved delivery addresses.
- City-based shipping rate calculation.
- Nav/highlight changes for location.
