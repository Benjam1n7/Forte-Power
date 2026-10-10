# Forte Options — Mobile App Submission

This document is the single page a reviewer needs. Fill in the two blank links
after you build the APK and record the video, then everything is in one place.

---

## 1. Repository (source code)

> **https://github.com/Benjam1n7/Forte-Power**
>
> The mobile application source is inside the **`mobile/`** directory.
> (The existing website lives in the root and was not changed, except an
> additive `.gitignore` entry for mobile build artifacts.)

Key files for review:
- `mobile/src/context/CartContext.tsx` — shared cart + sync logic
- `mobile/src/context/AuthContext.tsx` — Google OAuth (Supabase) + sessions
- `mobile/src/app/checkout.tsx` — checkout via the existing `create-order` function
- `mobile/eas.json` — preview **APK** build profile
- `mobile/README.md` — setup, OAuth, and build instructions

---

## 2. APK download link

> **https://expo.dev/artifacts/eas/o0UeneIQCk6_nHOZTAycpW5LzVAzet4YPxDWEUWdUew.apk**

> **Recommended for submission:** also upload this APK to **Google Drive** and put
> that link here, because the direct Expo artifact link expires ~2 weeks after the
> build and some networks have trouble downloading from Expo directly.
> Steps: open the link above → download `forte-options.apk` → upload to Google
> Drive → set sharing to "Anyone with the link" → paste the Drive link below.

Google Drive / file-share link:
> **⬅️ PASTE YOUR GOOGLE DRIVE LINK HERE (optional but recommended)**

Build details:
- Application ID: `ng.forteoptions.shop`
- Build type: installable **APK** (preview profile), not an App Bundle
- Built with EAS (profile `preview`), SDK 57.0.0, version 1.0.0
- To rebuild: double-click **`BUILD-APK.bat`** at the repo root

---

## 3. Video demonstration

> **⬅️ PASTE YOUR VIDEO LINK HERE (Drive/YouTube/unlisted)**

See **`VIDEO_SCRIPT.md`** for the exact steps to demonstrate. The video must
show, in one continuous recording:

- Sign in with **the same Google account** on the app and the website.
- Add on the website → appears in the app (after refresh).
- Add on the app → appears on the website (after refresh).
- Quantity changes and removals propagate to the other platform.
- The cart persists after closing and reopening the app.

---

## Notes for the reviewer

- **Shared backend:** the app uses the same Supabase project, `products`,
  `carts` (RLS-protected), and `create-order` Edge Function as the website.
  There is no second database and no mobile-only account.
- **Security:** only the public anon key ships in the app; the service-role key
  stays server-side inside `create-order`. Prices/discounts are recalculated on
  the server — the client never sets a price or an order status.
- **Sync model:** pull-based (refresh on focus/foreground and after changes),
  because the schema does not enable Realtime on `carts`. No realtime is claimed.
- Full details: `MOBILE_BUILD_REPORT.md` and `mobile/README.md`.
