# Farhaan Men's Saloon — Smart Queue & Barber Appointment App

> **Engineered by:** **Dr. Mohd Muzzafar Lone**  
> **Contact & WhatsApp:** **+91 6006225007**  
> *Custom Smart Queue, Online Booking & PWA Solutions for Salons, Aesthetic Clinics & Small Businesses.*

---

## 🌟 Executive Overview

**Farhaan Men's Saloon** is a production-ready, mobile-first Progressive Web App (PWA) built specifically for a four-barber salon. It completely eliminates physical waiting room congestion by allowing customers to:
1. Scan an in-salon QR code or open a shared link on any Android or iOS device **without installing an app or registering an account**.
2. Grab a digital token either for **"Any Available Barber" (fastest turnaround)** or choose their **favourite barber**.
3. Browse a **Trending Haircut & Beard Lookbook** across 8 categories (Fades, Classics, Textured Crops, Beards, Moustaches, Combos) and show high-resolution reference photos and cutting guides directly to their barber.
4. Book **guaranteed online appointments** when enabled by the salon owner with zero double-booking conflicts.
5. Access dedicated, thumb-friendly interfaces for all **four barbers** and a complete **Salon Owner Command Center**.

---

## 🚀 Key Features

### 1. Customer Live Queue Experience
- **Instant Token Issuance:** Generates sequential tokens (`F-101`, `S-101`, `Z-101`, `I-101`) with unguessable secure URLs (`/?token=sec_xxx`).
- **Real-time Queue Estimation:** Calculates wait ranges dynamically using active chair elapsed duration, upcoming customers, and scheduled appointments.
- **In-Salon QR Pass:** Displays a scannable digital QR code for rapid counter check-in.
- **One-Click Sharing:** Instant WhatsApp token status sharing and clipboard copy.
- **Customer Cancellation:** Customers can cancel their token with confirmation if plans change.

### 2. Four Master Barbers
1. **Farhaan Lone** (Owner & Master Stylist • 12+ yrs • PIN: `1111`) — Signature Skin Fades & Royal Shaves.
2. **Sameer Khan** (Senior Barber • 8 yrs • PIN: `2222`) — Modern Textured Crops & Beard Fades.
3. **Zahid Mir** (Styling Specialist • 6 yrs • PIN: `3333`) — Classic Scissor Cuts & Pompadours.
4. **Irfan Dar** (Speed & Precision Barber • 5 yrs • PIN: `4444`) — Crew Cuts & Head Massages.

### 3. Haircut & Beard Styles Lookbook
- **8 Categories Supported:**
  - Fade and Taper
  - Classic Haircuts
  - Modern and Textured Hairstyles
  - Crew Cuts and Short Hairstyles
  - Long Hairstyles
  - Beard Trimming and Shaping
  - Moustache Styles
  - Haircut and Beard Combinations
- **Barber Reference Modal:** Full-screen reference card with barber technical cutting notes.
- **Local Favorites:** Customers can heart styles to save them locally.
- **1-Tap Prefill:** Selecting a look prefills the service into the live queue or online booking.

### 4. Online Appointments Engine
- **Master ON/OFF Switch:** Prominently controlled from the Salon Owner dashboard.
- **Conflict Prevention (`isSlotAvailable`):** Prevents overlapping slots and respects barber hours and buffers.
- **Pay at Salon Model:** Clean confirmation with unique booking references (`APT-XXXX`).

### 5. Barber Workstation Interface
- **Mobile-First 1-Hand Controls:** Oversized touch buttons for "Seat Customer", "Complete Service", and "Skip Customer".
- **Live Chair Elapsed Timer:** Real-time ticking timer tracking active haircuts.
- **Recoverable Skipped Customers:** Skipped customers never disappear; barbers can recall them back to the active chair at any time.
- **Break & Status Controls:** 15-minute tea break, 30-minute lunch break, and offline toggles.

### 6. Salon Owner / Admin Dashboard
- **Live Multi-Barber Orchestrator:** View all 4 chairs and queues simultaneously.
- **Manual Walk-in Addition:** Add walk-ins directly with optional priority placement.
- **Customer Reassignment:** Transfer a customer between barbers with audit trail logging.
- **Business Management:** Add/edit services in Indian Rupees (₹), adjust pricing, update the lookbook, and view daily revenue calculations.

---

## 🛠️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **Icons & QR** | Lucide React, `qrcode.react`, Canvas Confetti |
| **Backend & DB** | Supabase PostgreSQL (13 Relational Tables with RLS & Triggers) |
| **Persistence** | Hybrid: Reactive Local Storage Engine + Supabase Sync |
| **PWA & Offline** | Web App Manifest (`manifest.webmanifest`), Service Worker (`sw.js`) |
| **Timezone & Currency** | `Asia/Kolkata` (IST) & Indian Rupees (₹) |

---

## 🗄️ Database Schema (`supabase/schema.sql`)

The production schema includes 13 relational tables:
1. `salons` — Profile, working hours, online booking flag.
2. `user_profiles` — Staff roles and 4-digit PINs.
3. `barbers` — Individual barber profiles, statuses, average durations.
4. `services` — Master service catalog in ₹.
5. `haircut_styles` — Lookbook gallery with photos and barber cutting instructions.
6. `barber_services` — Custom pricing/durations per barber.
7. `business_hours` — Weekly schedule (09:00 - 21:00).
8. `barber_breaks` — Scheduled lunch/tea breaks.
9. `queue_entries` — Active and completed tokens with priority orders.
10. `appointments` — Reserved bookings with reference codes.
11. `notification_preferences` — Web Push subscriptions.
12. `salon_settings` — Master salon configuration.
13. `audit_logs` — Reassignment records and operational changes.

### Running the Database Migration
1. Log into your [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor**.
3. Copy the contents of [`supabase/schema.sql`](file:///c:/Users/admis/OneDrive/Desktop/My%20Projects/Saloon%20App/supabase/schema.sql) and click **Run**.
4. Retrieve your `Project URL` and `anon public key` from **Project Settings > API**.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SALON_NAME="Farhaan Men's Saloon"
VITE_DEFAULT_TIMEZONE=Asia/Kolkata
VITE_CREATOR_NAME="Dr. Mohd Muzzafar Lone"
VITE_CREATOR_PHONE=+916006225007
```

---

## 📱 How to Install PWA on Android & iOS

### Android (Google Chrome / Brave / Edge)
1. Open the salon URL in Chrome.
2. An **"Install Farhaan Saloon PWA"** banner will automatically appear at the top.
3. Tap **Install** or tap the three dots (`⋮`) > **Add to Home screen**.
4. The app icon will appear on the Android home screen with instant launch and standalone window mode.

### iPhone / iPad (Safari)
1. Open the URL in Safari.
2. Tap the **Share** button (box with upward arrow).
3. Scroll down and tap **Add to Home Screen**.

---

## 🧪 Automated Testing

Automated test suite is located in [`src/tests/queueLogic.test.ts`](file:///c:/Users/admis/OneDrive/Desktop/My%20Projects/Saloon%20App/src/tests/queueLogic.test.ts).

Run tests at any time using:
```bash
npx tsx -e "import { runAutomatedTests } from './src/tests/queueLogic.test.ts'; console.log(runAutomatedTests());"
```

All 5 core critical tests pass:
- ✅ Active service elapsed time reduces wait range.
- ✅ "Any Available Barber" assigns the barber with earliest capacity.
- ✅ Sequential token generation guarantees zero duplicate active tokens.
- ✅ Double-booking collision prevention for online appointments.
- ✅ Accurate queue position and customers ahead calculation.

---

## 📞 App Developer & Small Business Inquiries

Custom development inquiries for Barbershops, Clinics, Studios, and Small Businesses:

- **Developer:** **Dr. Mohd Muzzafar Lone**
- **Direct Phone:** **+91 6006225007**
- **WhatsApp:** [Chat on WhatsApp](https://wa.me/916006225007?text=Hello%20Dr.%20Mohd%20Muzzafar%20Lone,%20I%20am%20interested%20in%20a%20Smart%20Queue%20%26%20Appointment%20App%20for%20my%20business.)
