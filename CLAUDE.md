# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev     # Start dev server at http://localhost:3000
npm run build   # Production build (also the main type/correctness check)
npm run lint    # ESLint (next/core-web-vitals)
npm start       # Serve production build
```

There is no test suite. Node >= 20 is required. Server-side features (Stripe checkout, uploads, deliverables API) need env vars from `.env.example` in `.env.local`; the Firebase *client* config is hardcoded in `src/app/firebase.ts` and needs no env vars.

Stripe webhooks are optional locally: the payment success page confirms payments via `POST /api/stripe/verify-session`, so the flow works without `stripe listen`. To also test webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook` and put the printed secret in `STRIPE_WEBHOOK_SECRET`.

## Architecture

Next.js (App Router) + TypeScript + Tailwind CSS 4 travel-agency app backed by Firebase (Auth, Firestore) with Stripe payments. Uploaded files live on the local filesystem, NOT Firebase Storage (see "File storage" below). Path alias `@/*` → `./src/*`.

### Client-first with two Firebase SDKs

Almost every page is a `"use client"` component that reads/writes Firestore directly with the client SDK. Server code exists only in `src/app/api/` route handlers, which use the Admin SDK. Keep the two separate:

- `src/app/firebase.ts` — client SDK (`auth`, `db`). Used by components/pages/stores.
- `src/lib/firebase-admin.ts` — Admin SDK (`adminDb`, `adminStorage`, `adminAuth`), lazily initialized via Proxy so importing it doesn't crash without env vars. API routes only.
- `src/lib/stripe.ts` — lazy Stripe client, same pattern.

Note there are two `lib` directories: `src/lib/` (server-only clients) and `src/app/lib/` (shared validation schemas, e.g. `validations/product.ts` with the zod `productSchema` and the fixed `CATEGORIES` list: visa, ticket, scholarship, asylum, form).

### Data model (Firestore)

- `users` — created on signup; `role` field is `"user" | "admin" | "superadmin"` (absent = user).
- `items` — the travel packages/products (called "products" in the admin UI, "packages" on the public site). Shape defined by `Item` in `src/app/store/itemStore.ts`.
- `appointments` — the core entity; a user's booking of an item, carrying status, uploaded document URLs, `payment` object, `approvedPrice`, and `deliverables` (Storage paths).

### Appointment lifecycle (the central state machine)

Payment happens AT BOOKING, at the package's listed price. Flow: `payment_pending` → `pending` → `processing` → `documents_requested` → `documents_uploaded` → `approved` → `completed`, with `rejected` as a terminal branch (`paid` exists only as a legacy status on old documents). Status meanings are enforced across several files that must stay consistent:

1. `AppointmentForm.tsx` (requires sign-in) creates the appointment as `payment_pending`, then immediately calls `POST /api/stripe/create-checkout-session` and redirects to Stripe Checkout. The checkout API requires status `payment_pending` and always prices from the item document.
2. Payment confirmation is dual-path and idempotent: `POST /api/stripe/webhook` (`checkout.session.completed`) AND `POST /api/stripe/verify-session` (called by the success page — this is what makes local demos work without webhook forwarding). Both advance `payment_pending` → `pending` and set `payment.status: "succeeded"`; neither regresses a later status. `checkout.session.expired` keeps `payment_pending` so the user can retry from My Appointments.
3. Admin pages (`src/app/admin/appointments/`) move paid appointments through review; requesting documents sets `documents_requested`; the user uploads files from `my-appointments/page.tsx`, setting `documents_uploaded`; admin sets `approved` then `completed`. There is no admin pricing step anymore.
4. `GET /api/deliverables` streams deliverable files, gated on ownership + successful payment (`payment.status === "succeeded"` or status `paid`/`completed`).

The status union type is duplicated in `my-appointments/page.tsx`, `admin/appointments/page.tsx`, `admin/dashboard/page.tsx`, and `admin/appointments/[id]/page.tsx` — update all of them when adding a status, and add matching `statusConfig` entries (a missing entry crashes rendering).

### File storage (local filesystem, not Firebase Storage)

Firebase Storage is not used (it requires the Blaze plan). All files live under `<project root>/uploads/` (gitignored), managed by `src/lib/uploads.ts`:

- `POST /api/upload?kind=image|document|deliverable` — auth via Bearer ID token; `image`/`deliverable` require admin role (checked against the `users` collection). Files get random UUID names; the original name is kept in Firestore.
- `GET /api/files/<images|documents>/...` — serves public uploads (package images, appointment documents). Deliverables are deliberately excluded from this route.
- Client-side uploads all go through `src/app/lib/uploadFile.ts`.
- Old Firestore records may still hold dead `firebasestorage.googleapis.com` URLs; `PackageImage.tsx` renders a branded fallback tile for any broken/empty image. Re-uploading via the admin product form fixes them permanently.

### Notifications

`src/app/components/NotificationProvider.tsx` (mounted in `layout.tsx`) diffs real-time appointment snapshots and fires react-toastify toasts plus browser Notifications: customers hear about admin messages, document requests, status changes, and new deliverables; admins hear about new bookings, customer messages, document uploads, and payments. It skips the initial snapshot and diffs per-appointment digests — extend the `digest()`/branch logic to add events.

### Auth and authorization

- Client auth via `react-firebase-hooks` (`useAuthState(auth)`); email/password and Google sign-in on `/login`.
- Roles live in the `users` Firestore doc and are loaded into the zustand `userStore` by email lookup. Admin pages gate access client-side: each page under `/admin` checks `role` and redirects (the admin layout does NOT gate). `superadmin` additionally can change user roles in `/admin/users`.
- API routes authenticate with a Firebase ID token in the `Authorization: Bearer <token>` header, verified via `adminAuth.verifyIdToken`, then check appointment ownership (`appointment.userId === uid`). The Stripe webhook authenticates via signature verification instead. Follow this pattern for any new API route.

### State (zustand)

- `userStore` — current user's role + loading flag.
- `itemStore` — cached items list, persisted to localStorage under key `items-storage`; pages hydrate from it and refresh from Firestore.
