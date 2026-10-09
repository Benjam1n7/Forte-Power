# Forte Options — Android Mobile App

Production-quality React Native (Expo) shopping app for **Forte Options**, built on
top of the existing website backend (Supabase). It shares the **same Supabase
project, products, users, persistent cart table, and `create-order` Edge Function**
as the storefront — there is no second database and no mobile-only account.

- **Framework:** Expo (SDK 57) · React Native · TypeScript · Expo Router
- **Android application ID:** `ng.forteoptions.shop`
- **Deep-link scheme:** `forteoptions://` (OAuth callback → `forteoptions://auth-callback`)

---

## 1. Requirements

| Tool | Version |
| --- | --- |
| Node.js | **20 LTS** or newer (Node 18 is EOL) |
| npm | 10+ (ships with Node 20) |
| EAS CLI | optional for cloud APK builds |

Install the Expo CLI (optional, `npx` works without a global install):

```bash
npm install -g eas-cli
```

---

## 2. Install dependencies

All commands below run from the **`mobile/`** directory.

```bash
cd mobile
npm install
```

---

## 3. Environment configuration

The app reads **two public** Supabase values. These are safe to ship in the app —
`EXPO_PUBLIC_*` variables are inlined into the JS bundle and are the same anon key
the public website already uses. **Never** put the service-role key or a database
password anywhere in this app; privileged writes happen only inside the
`create-order` Edge Function.

Copy the example file and fill it in:

```bash
cp .env.example .env
```

`.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Get both values from **Supabase dashboard → Project Settings → API** for the same
project the website uses:

- `EXPO_PUBLIC_SUPABASE_URL` → **Project URL**
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` → **Project API keys → `anon` `public`**

`.env` is git-ignored. `.env.example` is committed with placeholder names only.

> If the values are missing the app still builds and runs (it shows a clear
> "Supabase is not configured" notice and falls back to the bundled catalogue),
> but sign-in and cart sync require a real `.env`.

---

## 4. Local development

```bash
cd mobile
npx expo start
```

- Press **`a`** to open on a connected Android device / emulator.
- Scan the QR code with **Expo Go** for quick iteration.

---

## 5. Google OAuth setup (one-time)

Authentication targets the **existing** Supabase project and Google account the
website uses. No new account is created on mobile.

### 5a. Google Cloud Console

1. Open **Google Cloud Console → APIs & Services → Credentials** and select the
   **same OAuth 2.0 Client ID** the website already uses (do not create a new one
   unless you want a separate Android client).
2. Under **Authorized redirect URIs**, keep the existing web entry and confirm the
   Supabase callback is present:
   ```
   https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
   ```
   This is the **same URL the website already relies on** — leave it unchanged so
   production web login is not affected.

### 5b. Supabase dashboard

1. **Authentication → URL Configuration → Redirect URLs**: add the mobile deep
   link (this is an **additive** change; existing web URLs remain):
   ```
   forteoptions://auth-callback
   ```
2. **Authentication → Providers → Google**: already enabled for the website —
   reuse it. No change required.

### 5c. Application ID / fingerprint (only if using a native Google client)

If you use a separate **Android** OAuth client (optional), register the package
name `ng.forteoptions.shop` plus the SHA-1 of your signing keystore in Google
Cloud. For the browser-based PKCE flow configured here, the web client ID is used
and no Android client is required.

> **Impact note:** The only configuration the mobile app *adds* is the
> `forteoptions://auth-callback` redirect URL in Supabase. It does not remove or
> modify any existing production OAuth setting, so website login is unaffected.

---

## 6. Android build — installable APK

This project is configured to output a **directly installable APK** (not an Android
App Bundle) for preview/testing.

### Option A — EAS cloud build (recommended, no local Android toolchain)

```bash
cd mobile
npm install -g eas-cli      # if not already installed
eas login
eas build:configure         # creates the EAS project link (first run only)
eas build -p android --profile preview
```

When it finishes, EAS prints a URL to download the `.apk`. Install it on the device
(`adb install path/to.apk`, or open the link on the phone).

The `preview` profile in `eas.json` already sets `"buildType": "apk"` and
`distribution: internal`.

### Option B — local build (requires Android Studio + SDK)

```bash
cd mobile
npx expo prebuild -p android          # generates the native android/ project
cd android
./gradlew assembleRelease             # produces an installable APK
# APK output: android/app/build/outputs/apk/release/app-release.apk
```

For a debug-installable APK: `./gradlew assembleDebug` →
`android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 7. Testing on a physical Android device

1. Build the preview APK (section 6, Option A) — this gives you a
   development-capable release that can receive the `forteoptions://` deep link.
2. Enable "Install from unknown sources" on the device and install the APK.
3. Ensure `.env` was included in the build (EAS injects env at build time; see
   `eas.json`).
4. Sign in with **the same Google account you use on the website**.
5. Verify shared-cart behaviour (see the test checklist in the repository root
   `MOBILE_BUILD_REPORT.md`).

---

## 8. Project structure

```
mobile/
├── app.json               # Expo config (name, icon, splash, scheme, android.package)
├── eas.json               # EAS build profiles (preview = APK)
├── .env.example           # public env var names only (no secrets)
├── assets/images/         # app icon, splash, bundled product images
├── src/
│   ├── app/               # Expo Router routes
│   │   ├── _layout.tsx    # providers + splash controller
│   │   ├── (tabs)/        # Home, Shop, Cart, Account
│   │   ├── product/[id]   # product detail
│   │   ├── checkout.tsx   # order form → create-order function
│   │   └── auth-callback  # OAuth deep-link landing
│   ├── components/        # ProductCard, QuantityStepper, StateViews
│   ├── context/           # Auth, Cart (shared sync), Products
│   ├── lib/               # supabase client, secure storage, types, images, format
│   ├── data/catalog.ts    # offline fallback catalogue (mirrors website)
│   └── constants/brand.ts # brand palette
└── scripts/               # asset generation helper
```

---

## 9. Shared cart — how it stays in sync with the website

- Reads/writes the **same** `public.carts` row (`user_id` unique, `items` JSONB)
  the website uses, scoped to the signed-in user and protected by the existing
  Row Level Security policies (anon key only — no service-role bypass).
- The persisted `CartItem` shape is **byte-identical** to the website's, so items
  added on either platform render the same on the other.
- Local edits apply optimistically and push through a single-flight queue that
  always writes the newest snapshot (a slow stale write can't clobber a newer
  one). On first sign-in the server and device carts are **merged** (no lost or
  duplicated items).
- The schema does **not** add `carts` to Supabase Realtime, so sync is
  **pull-based, not push**: the app refetches when it returns to the foreground,
  on tab/screen focus, after every mutation, and via pull-to-refresh. On the web
  the cart is re-read on navigation and after each update. Cross-device changes
  therefore appear within a screen focus / refresh — not instantly.
- The device-local cart is also cached in AsyncStorage so the cart survives app
  restarts while signed out, and is merged into the server cart at sign-in.

---

## 10. Payments & checkout

- Checkout calls the **existing** `create-order` Supabase Edge Function.
- Only product IDs and quantities leave the device. **All** prices, the bundle
  discount, and delivery fee are recalculated server-side from the products table;
  the order and order items are written with the service-role key *inside* the
  function. The client never sets a price or an order status.
- The function supports `pay_on_delivery` and `bank_transfer`; the app exposes
  exactly those two. No Paystack path is invented. See `MOBILE_BUILD_REPORT.md`
  for the backend checklist.

---

## 11. Useful commands

```bash
npm start              # Expo dev server
npm run android        # open on Android
npx tsc --noEmit       # TypeScript check
npx expo export -p android --output-dir dist   # production bundle check
eas build -p android --profile preview         # installable APK
```

