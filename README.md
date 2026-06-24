This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Setting up a public demo deployment

This app supports a read-only "demo mode" so it can be shared publicly for feedback
without anyone being able to edit your real word list. Demo mode is controlled by one
env var and runs against its **own** Supabase project so the two datasets never mix.

1. **Create a new Supabase project** at [supabase.com](https://supabase.com/dashboard) (free tier is fine).
2. Open its **SQL Editor** and run [`scripts/schema-demo.sql`](scripts/schema-demo.sql).
   This creates the same `lessons`/`characters` tables as production, but with Row
   Level Security enabled and **no write policies** — so even someone who finds the
   public anon key in the browser bundle and calls Supabase directly can only read
   data, never modify it. (Don't use `scripts/schema.sql` here — that one matches
   production, which has RLS disabled.)
3. Seed it with the same vocabulary:
   ```bash
   SUPABASE_URL=https://<new-project>.supabase.co \
   SUPABASE_KEY=<new-project-service_role-key> \
   node scripts/seed.mjs
   ```
   Use the **service_role** key only for this one-off seeding command — never put it
   in `.env` or ship it to the client. The deployed app itself only ever uses the
   public anon key (read-only, enforced by RLS above).
4. In [Vercel](https://vercel.com/new), **import this same GitHub repo a second time**
   as a brand-new project (don't reuse the existing one — you want a separate domain).
5. In that new Vercel project's **Settings → Environment Variables**, set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<new-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<new-project-anon-key>
   NEXT_PUBLIC_DEMO_MODE=true
   ```
6. Deploy. Any push to the repo's main branch will now redeploy **both** the
   production app and the demo app automatically, since they share the same codebase.

With `NEXT_PUBLIC_DEMO_MODE=true`, adding or deleting a word/character and adding or
deleting a lesson all show a toast — *"This is only a demo product, you're not allowed
to do that action."* — instead of writing to the database. Everything else (browsing
Words, Practice, and Challenge, including audio and stroke order) works normally.
