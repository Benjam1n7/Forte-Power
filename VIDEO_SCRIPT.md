# Forte Options — Video Demonstration Script

Record **one continuous screen recording** that proves the mobile app and the
existing website share the **same login** and the **same persistent cart**.

## Before you record (one-time setup)

1. Install the APK on your Android phone (from the Google Drive link / build).
2. In **Supabase → Authentication → URL Configuration → Redirect URLs**, make
   sure this line exists (add it if missing — it does not affect the website):
   ```
   forteoptions://auth-callback
   ```
3. Have your **website open on a computer**, signed in with the **same Google
   account** you will use on the phone.

## Recording tips

- Use the phone's built-in **Screen recorder** (quick settings tile).
- Record the **phone** for the app; you may picture-in-picture or switch to the
  computer for the website steps. Keep it a **single continuous** file.
- Cart sync is **refresh-based**, not instant. Whenever you switch platforms,
  **pull down / refresh** the screen. Say out loud "I'm refreshing now."

## The script (do these in order)

| # | On | Do this | What the reviewer should see |
|---|----|---------|------------------------------|
| 1 | Phone | Open the app, go to **Account** | App opens to the branded splash, then Account |
| 2 | Phone | Tap **Continue with Google**, pick your account | Google screen → returns to app signed in |
| 3 | Computer | Website → sign in with the **same** account | Website shows you logged in |
| 4 | Computer | Website → **add a product** to the cart | Cart badge/count increases on the site |
| 5 | Phone | App → **Cart** tab → **pull down to refresh** | The website's product appears in the app cart |
| 6 | Phone | App → **Shop** → **add a different product** | Item added; cart count increases |
| 7 | Computer | Website → **refresh** the cart | The phone's product now appears on the website |
| 8 | Phone | Change a **quantity** (+), let it sync | Quantity updates on the phone |
| 9 | Computer | Website → **refresh** | Quantity change is reflected on the website |
| 10 | Phone | **Remove** an item | Item removed from the phone cart |
| 11 | Computer | Website → **refresh** | Removal is reflected on the website |
| 12 | Phone | **Force-close** the app, then reopen | Cart contents are still there (persisted) |
| 13 | Phone | (Optional) **Sign out** | Returns to the signed-out Account screen |

## What proves success (the key moments)

- The **same Google account** works on both the website and the app.
- An item added on the **website** shows up in the **app** after a refresh.
- An item added on the **app** shows up on the **website** after a refresh.
- **Quantity** changes and **removals** propagate to the other platform.
- The cart **survives** closing and reopening the app.
