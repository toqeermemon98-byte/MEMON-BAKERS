# MEMON BAKERS 2.0

React + Vite storefront with an Express API and Supabase Postgres database.

## Features
- Customer registration/login and order history
- Product catalogue, categories, search, basket and checkout
- Admin dashboard for orders, products and customers
- Cash on Delivery orders stored in Supabase
- Card/Raast, JazzCash and Easypaisa are shown as pending payment methods only; real collection needs a merchant gateway integration and verified webhooks.

## Local setup
1. Install Node.js 20 or newer.
2. Run `npm install` from the project root.
3. Create a Supabase project.
4. Run `supabase/schema.sql` in Supabase Dashboard → SQL Editor.
5. Copy `server/.env.example` to `server/.env` and fill in the Supabase URL, server-only service role key, JWT secret and admin credentials.
6. Copy `client/.env.example` to `client/.env` (leave `VITE_API_URL` empty for local development).
7. Run `npm run dev` from the project root.
8. Open `http://localhost:5173`.

## Supabase and production deployment
See `DEPLOYMENT_SUPABASE.md`. The frontend is deployed to Vercel with the `client` folder as Root Directory. The Express API must be deployed separately as a Node service. Set `VITE_API_URL` on Vercel to that API's public base URL.

## Security
- Never put `SUPABASE_SERVICE_ROLE_KEY` in the browser or any `VITE_*` variable.
- Never commit `.env` files. Use host environment-variable settings for production secrets.
- Change the sample admin email/password and use a long random `JWT_SECRET`.
- RLS is enabled on all tables; the server accesses the database using the service role key.

## Existing data
The previous version used a local SQLite database. This Supabase setup creates a new database and sample products; it does not automatically transfer existing local customers, passwords or orders.
