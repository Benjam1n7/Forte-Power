# Forte Power Systems (Nigeria)

> **"When the grid collapses, light stays on."**  
> Engineered power-resilience hardware kits designed specifically for Nigerians experiencing daily electrical blackouts. Zero fuel queues, zero engine noise, zero carbon monoxide emissions.

---

## Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                            │
│  React 19 + TypeScript + Tailwind CSS + Bricolage Grotesque & IBM Mono │
└──────────────────┬─────────────────────────────┬───────────────────────┘
                   │                             │
                   ▼                             ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│         STATE & CONTEXT           │ │      RECOMMENDATION ENGINE       │
│  - AuthContext (Supabase PKCE)    │ │  (src/lib/recommendation.ts)    │
│  - CartContext (Grouped by kit,   │ │  Energy Needed =                 │
│    swappable items, 5% bundle)    │ │    ∑(Watts × Hours) + 20% margin │
│  - LocalStorage / Supabase Carts  │ │  Greedy cost-optimal allocation  │
└──────────────────┬────────────────┘ └──────────────────┬───────────────┘
                   │                                     │
                   ▼                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE INFRASTRUCTURE                         │
│                                                                        │
│  ┌───────────────────────┐              ┌───────────────────────────┐  │
│  │     Supabase Auth     │              │     Edge Function         │  │
│  │   (Google OAuth 2.0)  │              │     "create-order"        │  │
│  └───────────┬───────────┘              │  Authoritative DB pricing │  │
│              │                          └─────────────┬─────────────┘  │
│              ▼                                        ▼                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      PostgreSQL Database                         │  │
│  │  - products     (14 verified hardware items with laboratory spec)│  │
│  │  - orders       (RLS protected, audit trail)                     │  │
│  │  - order_items  (immutable price snapshots)                      │  │
│  │  - carts        (cross-device persistence for authenticated users│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Features

1. **4 Reality Personas (No Clutter, No Fake Testimonials):**
   - Student & Researcher (hostel reading lights, laptop, phone)
   - Remote Worker (continuous 65W laptop charging, WiFi router, silent airflow)
   - Shop Owner & Merchant (dual POS terminals, shop lighting, cashier breeze)
   - Family & Apartment (silent bedroom airflow, zero generator smoke)
2. **3-Step Resilience Kit Builder:**
   - Step 1: Device checklist with direct numeric wattage tuning + custom appliance additions.
   - Step 2: Blackout duration slider spanning 1 to 14 hours.
   - Step 3: Engineered kit recommendations calculated with a 20% safety margin and 5% bundle discount.
3. **Anti-Counterfeit "Verified Genuine" Modal:**
   - Inspection report panel showing 65W bench discharge tests, 160V–260V grid surge tolerances, internal Grade-A cell guarantees, and 7-day unconditional return window.
4. **Interactive Component Swapping:**
   - Swap any item in a kit for compatible alternatives of the same category with live price-difference readouts.
5. **Cost vs. Petrol Generator Payback Calculator:**
   - Compares kit cost against current filling station petrol prices and generator servicing costs, explaining the break-even arithmetic in plain, direct English.
6. **Protected Checkout & Authoritative Edge Function (`create-order`):**
   - Guarded by Supabase Google OAuth while preserving cart contents.
   - Prefilled contact details, Nigerian phone validation, and destination state selector.
   - Authoritative recalculation of all subtotals from database rows before order persistence to prevent client tampering.

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Exposure |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase project URL (`https://xyz.supabase.co`) | Public Client |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon / Public Key | Public Client |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for Edge Functions / DB writes | **Server Only** |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key for card transactions | Public Client |
| `MAILGUN_API_KEY` | Mailgun API key for order confirmation receipts | **Server Only** |
| `MAILGUN_DOMAIN` | Mailgun sending domain (`mg.fortepower.ng`) | **Server Only** |

---

## Setup & Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Schema & Products Seed
Open your **Supabase Dashboard** $\to$ **SQL Editor**, and run the complete script found in:
```text
/supabase/schema.sql
```
This initializes the `products`, `orders`, `order_items`, `carts`, and `profiles` tables with Row Level Security (RLS) policies and seeds 14 verified hardware items.

### 3. Deploy Edge Function (Optional for Local Preview)
```bash
npx supabase link --project-ref <YOUR_SUPABASE_PROJECT_REF>
npx supabase functions deploy create-order --no-verify-jwt
```
*(The local Express server in `server.ts` also contains an embedded proxy fallback at `/api/create-order` so the app runs smoothly out of the box).*

### 4. Start the Application
```bash
# Run full-stack dev server (Express + Vite on Port 3000)
npm run dev

# Or build for production
npm run build
npm start
```

---

## Google Cloud Console & Supabase Redirect URLs

To enable Google Sign-In with Supabase Auth:

### In Google Cloud Console (OAuth 2.0 Client IDs):
- **Authorized JavaScript Origins:**
  - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co`
  - `https://ais-dev-wyxh26bzhq6zpxlpsirywx-589931576899.europe-west2.run.app`
  - `https://ais-pre-wyxh26bzhq6zpxlpsirywx-589931576899.europe-west2.run.app`
  - `http://localhost:3000`
- **Authorized Redirect URIs:**
  - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`

### In Supabase Dashboard (Auth $\to$ URL Configuration):
- **Site URL:**
  - `https://ais-dev-wyxh26bzhq6zpxlpsirywx-589931576899.europe-west2.run.app`
- **Additional Redirect URLs:**
  - `https://ais-dev-wyxh26bzhq6zpxlpsirywx-589931576899.europe-west2.run.app/**`
  - `https://ais-pre-wyxh26bzhq6zpxlpsirywx-589931576899.europe-west2.run.app/**`
  - `http://localhost:3000/**`

---

## 2-Minute Judge Demo Script

| Timestamp | Action on Screen | Voiceover / Pitch |
| :--- | :--- | :--- |
| **0:00 – 0:25** | Open Homepage. Hover over headline and click the **"Remote Worker"** persona card. | *"In Nigeria, power collapses aren't rare—they are daily routine. Instead of noisy petrol generators that consume expensive fuel, Forte Power delivers silent, anti-fragile DC & battery kits. Clicking 'Remote Worker' instantly configures the typical load: 50W laptop, WiFi router, and a desk fan for an 8-hour outage."* |
| **0:25 – 0:55** | Scroll into **3-Step Builder**. Adjust Laptop from 50W to 65W. Slide outage duration from 8h to 10h. Point to Step 3. | *"Our recommendation engine uses a greedy load-matching formula: total watts times blackout hours plus a 20% safety margin. In real-time, it allocates catalog items to meet the exact 780 Watt-hour demand at the lowest sensible price, applying a mandatory 5% bundle discount."* |
| **0:55 – 1:15** | Click the **"Verified Genuine"** badge on the 60,000mAh Power Bank. | *"Counterfeit electronics from open markets like Alaba are the number-one reason buyers hesitate. Clicking 'Verified Genuine' opens our lab inspection record: full 65W bench discharge tests, 160V-260V grid spike protections, and our 12-month direct 1-to-1 replacement warranty."* |
| **1:15 – 1:35** | Scroll down to **Cost vs. Petrol Generator**. Edit petrol price to `₦1,100 / L`. | *"Here is our generator payback calculator. It calculates fuel burn at 0.75 litres per hour plus regular spark plug and oil servicing. In plain language, it shows the user that their ₦118,000 kit pays for itself in just 3.4 months. Every month after that is money saved in their bank account."* |
| **1:35 – 2:00** | Click **"Proceed to Checkout with this Kit"**. Open Cart drawer, show **"How we deliver"** guarantee, and complete checkout. | *"The checkout route is protected via Supabase Google OAuth without losing cart items. On submit, our Supabase Edge Function recalculates all item prices directly from database rows to eliminate tampering, stores the immutable order snapshot, and returns an itemized receipt with an inspection-on-delivery guarantee."* |
