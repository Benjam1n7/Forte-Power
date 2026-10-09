# Forte Options — Mobile App Build Report

This report documents the audit of the existing website/backend, the mobile app
architecture in `mobile/`, the minimal (additive-only) web-side changes, the
verification checks that were actually run, and the steps that still require
manual testing or credentials.

**Nothing in the existing website was rebuilt, replaced, or broken.** The only
tracked web-file change is an additive block appended to the root `.gitignore`
(ignoring mobile build artifacts). All other work lives in the new `mobile/`
directory.

---

## 1. Existing implementation audit (as found)

### Authentication
- **Web:** Supabase Auth with **Google OAuth** (`src/context/AuthContext.tsx`,
  `src/lib/supabaseClient.ts`). Sessions persisted in browser storage.
- **Backend:** Supabase project (`https://ykurqerckzcgtmyvreyg.supabase.co`),
  Google provider already enabled, anon key used client-side.

### Products
- Single `public.products` table. Web reads via
  `fetchProductsFromDatabase()` (`src/lib/supabaseProducts.ts`) with a **local
  fallback catalogue** (`src/data/products.ts`) when Supabase is empty/unreachable.

### Cart (highest priority)
- **Persistent in Supabase**, not just localStorage. Table `public.carts`:
  - `user_id uuid` (unique, FK → auth.users), `items jsonb` (default `[]`),
    `updated_at timestamptz`.
  - **Row Level Security enabled** with policies so a user can only
    select/insert/update their **own** cart row (`auth.uid() = user_id`). No
    service-role key is used client-side anywhere.
  - `CartItem` JSONB shape (website `src/types/index.ts`): `id`, `productId`,
    embedded `product`, `quantity`, optional `kitSourceId` / `kitId` / `kitName`.
- Web writes are scoped to `user.id`, write the whole `items` array (upsert on
  `user_id`), and update `updated_at`.

### Checkout / payments
- **`create-order` Supabase Edge Function**
  (`supabase/functions/create-order/index.ts`) is the single source of truth.
  It re-fetches authoritative prices from `products`, recomputes subtotal,
  a **5% bundle discount** (kit present or ≥3 line items), delivery
  (`₦0` when subtotal ≥ ₦150,000 else `₦3,500`), inserts `orders` + `order_items`
  with the service-role key **inside the function**, clears the user's cart, and
  returns `{ success, orderId, orderNumber, order }`.
- Supported `payment_method` values are exactly `pay_on_delivery` and
  `bank_transfer`. **No Paystack/online payment path is implemented**, and no
  order is ever marked "paid" by a client.

---

## 2. Mobile architecture (smallest safe design)

- **Reused, not duplicated:** same Supabase project + anon key, same `products`,
  same `carts` table/RLS, same `create-order` function. One database, one
  account, one cart per user.
- **Auth:** `expo-web-browser` browser OAuth (PKCE) → redirect
  `forteoptions://auth-callback` → `exchangeCodeForSession`. Session persisted in
  **Expo SecureStore** (chunked adapter for the ~2KB SecureStore limit). Handles
  success, cancel, cold-start deep link, refresh, sign-out, offline, and errors.
- **Cart:** reads/writes the same `carts` row scoped to `user.id`; optimistic
  local updates pushed through a **single-flight write queue** (latest snapshot
  wins — a slow stale write cannot clobber newer state); **server + device cart
  merged on first sign-in**; pull-based refetch on foreground, screen/tab focus,
  and after every mutation; device cart cached in AsyncStorage while signed out.
- **Products:** identical row→domain mapping as the web, same fallback catalogue.
- **Checkout:** sends only `productId`/`quantity`/kit metadata to
  `create-order`; **all** prices/discounts/fees recalculated server-side.

> **Realtime note:** the schema does **not** add `carts` to the Supabase
> Realtime publication, so cross-device sync is **pull-based (refresh), not
> instant push**. This is stated plainly in the app UI and README — no realtime
> claim is made.

---

## 3. Web-side compatibility changes (minimal)

**No web cart code was changed.** The website already persists the cart to
Supabase (`carts` table, RLS, `items` JSONB) for authenticated users, which is
exactly the shared format the mobile app reads and writes. There was therefore no
"localStorage-only" gap to close for signed-in users, and no checkout behaviour
was touched.

The only web-side file change is an **additive** block in the root `.gitignore`
(ignoring `mobile/.env`, `mobile/android/`, `*.apk`, `*.aab`, keystores, etc.) so
mobile secrets and build artifacts never get committed.

---

## 4. Checks actually run (passed)

These were executed in this workspace and **passed**:

| Check | Command | Result |
| --- | --- | --- |
| Existing website still builds | `npm run build` (repo root, Vite) | ✅ exit 0, 1723 modules, no errors |
| Mobile TypeScript check | `npx tsc --noEmit` (mobile/) | ✅ no type errors |
| Mobile production bundle | `npx expo export --platform android` | ✅ Hermes `.hbc` bundle produced |
| No web source files modified | `git status --short` | ✅ only `.gitignore` (additive) + untracked `mobile/` |
| Secrets not committed | `git check-ignore mobile/.env mobile/node_modules` | ✅ ignored; `.env.example` tracked |
| Checkout uses backend | code review of `checkout.tsx` + `create-order` | ✅ IDs/quantities only; prices server-side |
| Cart data format matches web | `mobile/src/lib/types.ts` vs web `src/types` | ✅ byte-identical `CartItem` shape |

---

## 5. Still requires manual testing / credentials

These could **not** be completed in this environment and need a physical Android
device plus live credentials:

1. **Build the preview APK** — `cd mobile && eas build -p android --profile
   preview` (requires an Expo/EAS account and login). Produces an installable
   `.apk` (not an AAB).
2. **Google sign-in on a physical device** — requires adding
   `forteoptions://auth-callback` to **Supabase → Authentication → URL
   Configuration → Redirect URLs** (additive; does not affect the website).
   Then verify: sign in, cancel, expired-session handling, sign-out.
3. **Web → mobile cart sync** — add an item on the website, sign in on mobile,
   confirm it appears (pull-to-refresh or tab focus).
4. **Mobile → web cart sync** — add/change/remove on mobile, refresh the website.
5. **Cart survives app restarts** — background/kill/reopen the app.
6. **Checkout end-to-end** — place a `pay_on_delivery` order on mobile and
   confirm the order + order items are created by the backend and the cart clears.

> Expo **Go** cannot receive the `forteoptions://` deep link, so OAuth sign-in
> must be tested with a **development/preview build** (§6 of `mobile/README.md`).

---

## 6. One-time configuration checklist (you must do these)

- [ ] `cd mobile && cp .env.example .env`, then fill in
      `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from
      Supabase → Project Settings → API (anon key only).
- [ ] Add `forteoptions://auth-callback` to Supabase → Auth → URL Configuration →
      Redirect URLs.
- [ ] `cd mobile && npm install`.
- [ ] `cd mobile && eas build -p android --profile preview` → install the APK.

---

## 7. Files added / changed

**New (`mobile/`)** — app source, contexts (Auth/Cart/Products), screens
(Home/Shop/Cart/Account/Product/Checkout/AuthCallback), components, Supabase
client + SecureStore adapter, bundled product images, `app.json`, `eas.json`,
`.env.example`, `.gitignore`, `README.md`.

**Changed (web repo):**
- `.gitignore` — additive mobile-artifact ignore rules only.
- `MOBILE_BUILD_REPORT.md` — this report (new).

**Untouched:** all `src/`, `supabase/`, `index.html`, `vite.config.ts`,
`package.json` and existing web behaviour, including Google auth and checkout.
