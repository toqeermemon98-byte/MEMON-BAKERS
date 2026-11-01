# MEMON BAKERS 2.0 — Full-stack bakery store

A responsive React + TypeScript storefront with an Express + SQLite backend.

## Included
- Customer registration and login (passwords hashed with bcrypt; JWT sessions).
- Product catalogue, category filtering, search, basket and checkout.
- Customer order history.
- Admin dashboard: overview, revenue based on paid orders, order status management, add/remove products, customer directory.
- Cash on Delivery order creation persisted in SQLite.
- Safepay payment gateway adapter/configuration point. Online payments fail closed until merchant credentials and the complete hosted checkout + webhook flow are configured. It never pretends a payment succeeded.
- Responsive design for mobile and desktop.

## Requirements
- Node.js 20+ recommended.
- npm.

## Run locally
1. Extract this ZIP.
2. Open the project root in VS Code.
3. Run `npm install`.
4. Copy `server/.env.example` to `server/.env`.
5. Change `JWT_SECRET`, `ADMIN_EMAIL`, and especially `ADMIN_PASSWORD` in `server/.env`.
6. Run `npm run dev` from the project root.
7. Open `http://localhost:5173`.

The server starts at `http://localhost:4000`. SQLite database is created automatically at `server/data/memon-bakers.sqlite`.

## Admin login
The first server start seeds the admin user from `server/.env`:
- Email: `admin@memonbakers.com`
- Password: `ChangeThisAdminPassword123!`

Change both before use. If the database has already been created, changing the environment password does not reset the existing admin password. For a fresh local demo, stop the server and delete `server/data/memon-bakers.sqlite`, then restart.

## Online payments — Safepay (Pakistan)
The UI includes an Online Payment option and the backend has a fail-closed Safepay adapter route. Real money cannot be accepted until:
1. Register the bakery as a merchant with Safepay and complete their onboarding/KYC.
2. Get sandbox credentials first, then production credentials from the merchant dashboard.
3. Put the required credentials in `server/.env` (never put secret keys in client code).
4. Complete Safepay's hosted/embedded checkout flow for your merchant account and add server-side payment verification/webhook handling. Only verified gateway callbacks should change an order to Paid.
5. Test in sandbox before switching to production.

Official references:
- Safepay API docs: https://apidocs.getsafepay.com/
- Safepay checkout: https://safepay.com.pk/checkout

This starter intentionally does not simulate a successful online transaction. Until the gateway is fully configured, Cash on Delivery is the working payment option.

## Before going live
- Replace sample products, prices and Unsplash image URLs with the bakery's real catalogue and own photos.
- Update contact information, delivery zones, fees and business hours.
- Use HTTPS and a production database/hosting environment.
- Set strong unique secrets; never commit `.env`.
- Add rate limiting, email/phone verification, password reset, backups, privacy/terms pages and payment webhook signature verification before public launch.
- Have a developer review security and gateway integration before taking real customer payments.

## Main structure
- `client/src/App.tsx` — storefront, customer UI, basket, checkout and admin dashboard.
- `client/src/styles.css` — responsive visual styling.
- `server/src.ts` — API, authentication, SQLite schema, products, orders and admin routes.
- `server/.env.example` — environment settings.


## Memon Bakers business settings
- Location: Ghotki, Sindh, Pakistan
- WhatsApp / phone: 03021360530
- WhatsApp link: https://wa.me/923021360530
- Checkout methods shown: Cash on delivery, Card / Raast, JazzCash, Easypaisa.
- Non-COD orders are recorded as **Payment Pending**. The bakery must confirm payment with the customer via WhatsApp until merchant accounts and verified payment-gateway APIs/webhooks are configured. Do not treat a pending order as paid.
