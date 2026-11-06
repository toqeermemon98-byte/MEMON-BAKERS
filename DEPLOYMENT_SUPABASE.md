# MEMON BAKERS — Supabase + deployment

## 1. Create the database
1. Create a Supabase project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Run the complete `supabase/schema.sql` script.

## 2. Configure the API server
Deploy the `server` workspace as a Node.js service (for example, Render or Railway). Set these environment variables in that host's dashboard:
- `SUPABASE_URL`: Project URL from Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only secret from Supabase API keys. Never put this in the browser, GitHub, or any `VITE_*` variable.
- `JWT_SECRET`: long random secret.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`.
- `CLIENT_URL`: your Vercel website origin (for example `https://your-site.vercel.app`).
- `PORT`: supplied automatically by most hosts; otherwise `4000`.

The first API start inserts the sample products and creates the admin account if it does not exist.

## 3. Deploy the website
1. Import the GitHub repository into Vercel.
2. Set **Root Directory** to `client`.
3. Set `VITE_API_URL` to the public URL of the deployed API, without a trailing slash.
4. Deploy.

## 4. Important limitations
- Existing customer accounts, orders and products in the old local SQLite file are not automatically copied. This version starts with sample products and a fresh Supabase database. Export/import existing records separately if you need them preserved.
- Customer passwords from SQLite are not migrated by this schema; customers will need to register again.
- Card/Raast, JazzCash and Easypaisa options are recorded as pending. Actual online collection requires a merchant integration and verified payment webhooks. Cash on Delivery is the working method until then.
- Do not commit `.env` files or share the Supabase service role key.
