# Moore Money

A household personal finance tracker — pulls transactions from ANZ and Amex via
[Akahu](https://akahu.nz), stores them in Supabase, and (eventually) categorises and
reports on them with a Xero-like look and feel.

This is the MVP: Akahu sync (daily cron + manual "Sync now") into Postgres, plus an
Accounts overview and a filterable Transactions table. Categorisation (rules + AI) and
richer reporting are a later phase — see the plan for details.

## Stack

- [Next.js](https://nextjs.org) (App Router) + Tailwind + [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com): Postgres + Auth
- [Drizzle ORM](https://orm.drizzle.team) for schema/migrations
- [Akahu](https://developers.akahu.nz) as the bank data source
- Deployed on [Vercel](https://vercel.com), with a daily Vercel Cron sync

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Copy the env template** and fill in the values below.

   ```bash
   cp .env.example .env.local
   ```

3. **Akahu** — you already have a personal app at
   [my.akahu.nz](https://my.akahu.nz) connected to your shared ANZ + Amex accounts.
   Grab `AKAHU_APP_TOKEN` and `AKAHU_USER_TOKEN` from the Developers page.

4. **Supabase**
   - Create a project (or use an existing one).
   - **Settings → API**: copy the project URL and anon key into
     `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
     Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY` (not used by the MVP
     app code yet, but reserved for server-only admin tasks later).
   - **Settings → Database**: copy the pooled ("Transaction" mode) connection string
     into `DATABASE_URL`, and the direct connection string into `DIRECT_URL`.
   - **Authentication → URL Configuration**: add your deployed URL (and
     `http://localhost:3000` for local dev) to the redirect allow list, since sign-in
     uses a magic-link redirect to `/auth/callback`.

5. **Auth allowlist** — set `ALLOWED_EMAILS` to a comma-separated list of the emails
   allowed to sign in (yours + your wife's). Anyone else who signs in is rejected even
   with a valid Supabase session.

6. **Cron secret** — generate one and set it as `CRON_SECRET`:

   ```bash
   openssl rand -hex 32
   ```

7. **Run the first migration** against Supabase:

   ```bash
   npm run db:generate   # only needed after changing lib/db/schema.ts
   npm run db:migrate
   ```

8. **Start the app**

   ```bash
   npm run dev
   ```

   Sign in at `/login` with an allowlisted email, then use **Sync now** in the top bar
   to pull your Akahu accounts and transactions.

## Deploying to Vercel

1. Push this repo to `git@github.com:admo26/moore-money.git` and import it into Vercel.
2. Add every variable from `.env.example` to the Vercel project's Environment Variables
   (Production + Preview as needed). Never commit real values.
3. `vercel.json` already schedules `/api/cron/sync` to run daily; Vercel calls it with
   `Authorization: Bearer $CRON_SECRET` automatically once `CRON_SECRET` is set as an
   env var.
4. Add the deployed domain to Supabase's Auth redirect allow list (see step 4 above).

## Project structure

- `app/(app)/` — the authenticated app shell (sidebar/topbar) and pages
  (`accounts`, `transactions`).
- `app/(auth)/login/` — magic-link (and Google OAuth) sign-in.
- `app/auth/callback/` — exchanges the auth code for a session and enforces
  `ALLOWED_EMAILS`.
- `app/api/cron/sync/` — daily sync, guarded by `CRON_SECRET`.
- `app/api/sync/` — manual "Sync now", guarded by an authenticated + allowlisted user.
- `lib/akahu/` — Akahu API client + sync logic (upserts, so re-syncing is safe).
- `lib/db/` — Drizzle schema (`accounts`, `transactions`, `sync_runs`) and client.
- `proxy.ts` — Next.js proxy (formerly "middleware") that gates every page except
  `/login` and `/auth/callback` behind an authenticated + allowlisted session.
