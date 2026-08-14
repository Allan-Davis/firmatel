# Firmatel Security & Design Upgrade — Implementation Guide

Every file in this package is complete and final — nothing here needs
you to hand-edit code into an existing file except two one-line
exceptions, both called out explicitly in Step 3 and Step 4 below.
Everything else: copy the file to the destination path shown, done.

---

## STEP 0 — Where to extract the zip

Extract `firmatel-upgrade.zip` somewhere OUTSIDE your project first —
e.g. your Desktop or Downloads. You'll copy individual files/folders
from there INTO your real project folder (the one with your existing
`package.json`, `prisma/`, `app/` folders in it). Do not extract
directly into your project root — you'd overwrite `app/` and `prisma/`
wholesale, which you don't want for `app/`.

Assume your real project lives at, e.g.:
```
C:\Users\<you>\firmatel\        (Windows)
```
Everything below is relative to that folder.

---

## STEP 1 — Copy files to these exact destinations

Open the extracted `firmatel-upgrade` folder side-by-side with your
project folder and copy like this:

| From (in the zip) | To (in your project) | Action |
|---|---|---|
| `prisma/schema.prisma` | `prisma/schema.prisma` | **Overwrite** your existing file completely |
| `lib/security/signing.ts` | `lib/security/signing.ts` | New file — create the folder if it doesn't exist |
| `lib/security/audit-chain.ts` | `lib/security/audit-chain.ts` | New file |
| `lib/security/guilloche.ts` | `lib/security/guilloche.ts` | New file |
| `lib/db/prisma.ts` | `lib/db/prisma.ts` | Only copy if you don't already have a Prisma client file. If you do, skip this and see Step 4 note. |
| `styles/design-tokens.css` | `styles/design-tokens.css` | New file |
| `components/dashboard/Sidebar.tsx` | `components/dashboard/Sidebar.tsx` | **Overwrite** your current sidebar |
| `components/dashboard/StatCard.tsx` | `components/dashboard/StatCard.tsx` | New file |
| `app/verify/[verificationCode]/page.tsx` | `app/verify/[verificationCode]/page.tsx` | **Overwrite** |
| `app/verify/[verificationCode]/VerificationClient.tsx` | `app/verify/[verificationCode]/VerificationClient.tsx` | New file |
| `app/api/verification/[code]/route.ts` | `app/api/verification/[code]/route.ts` | **Overwrite** |
| `app/api/documents/route.ts` | — | **Reference only, see Step 3 note — don't blind-copy this one** |
| `scripts/generate-org-key.ts` | `scripts/generate-org-key.ts` | New file |
| `migrations/2026_security_upgrade.sql` | anywhere convenient | Only needed if you're not using Prisma migrate (see Step 5B) |

The `[verificationCode]` and `[code]` folder names include square
brackets — that's correct, that's how Next.js does dynamic routes.
Keep the brackets when you name the folder.

---

## STEP 2 — Add the master key to your `.env`

Open your terminal in your project folder and run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output. Open your existing `.env` file (the one that already
has `DATABASE_URL` in it) and add one new line at the bottom:

```
FIRMATEL_MASTER_KEY=<paste the output here>
```

Save. Do not commit `.env` to git — check that it's already listed in
your `.gitignore` (it almost certainly is if you're using Prisma's
default setup).

---

## STEP 3 — About `app/api/documents/route.ts`

This one file in the package is **not** a drop-in replacement,
because I don't have your actual current version of this route (only
your database schema, not your source code, made it to me). Instead:

1. Open the version in the zip — it's fully working and shows the
   correct order of operations: create document → sign it → write
   chained audit log.
2. Open your real `app/api/documents/route.ts`.
3. Copy the block labeled `// 3. SIGN IT` and the block labeled
   `// 4. AUDIT LOG` from the zip's version into your real file, right
   after your existing document-creation code, adjusting variable
   names (`doc`, `organizationId`, etc.) to match yours.

Do the same in your credential and ticket creation routes if you have
separate ones — same two blocks, same placement, just swap
`prisma.document` for `prisma.credential` / `prisma.ticket`.

---

## STEP 4 — Check your Prisma client import path

All the new files import the Prisma client like this:

```ts
import { prisma } from "@/lib/db/prisma";
```

If your existing project already exports a Prisma client from a
different path (common alternates: `@/lib/prisma`, `@/lib/db`), you
have two options:
- **Easiest:** copy `lib/db/prisma.ts` from the zip to that exact path
  anyway, so the import matches. It's a standard singleton pattern and
  safe to have alongside anything else.
- **Or:** find-and-replace `@/lib/db/prisma` with your actual path in
  these 3 files: `app/api/verification/[code]/route.ts`,
  `app/api/documents/route.ts`, `scripts/generate-org-key.ts`.

---

## STEP 5 — Apply the database changes

### Option A — Prisma CLI (recommended, do this if `npx prisma` works in your terminal)

```bash
npx prisma migrate dev --name security_upgrade
npx prisma generate
```

This reads your new `schema.prisma`, generates the SQL for you
automatically, applies it to your MariaDB database, and regenerates
the Prisma Client types.

### Option B — Direct SQL (if you manage the database through phpMyAdmin/XAMPP)

1. Open phpMyAdmin, select the `firmatel` database.
2. Go to the **SQL** tab.
3. Paste the contents of `migrations/2026_security_upgrade.sql` and
   run it.
4. Back in your terminal:
   ```bash
   npx prisma db pull
   npx prisma generate
   ```
   This syncs Prisma's understanding of the schema to match what you
   just created by hand, and regenerates the client. Then replace
   `prisma/schema.prisma` with the one from the zip anyway (Step 1),
   since `db pull` alone won't add the doc-comments/relation names
   cleanly.

---

## STEP 6 — Generate a signing key for your organization

You need your organization's `id` first. Either check your dashboard
(Settings, or look it up via phpMyAdmin in the `organization` table),
or run:

```bash
npx prisma studio
```
and open the `Organization` table to copy the `id` value.

Then, install `tsx` if you don't have it, and run the script:

```bash
npm install -D tsx
npx tsx scripts/generate-org-key.ts <paste-organization-id-here>
```

You should see:
```
Signing key created for organization: <Your Org Name>
Public key (safe to log/share): ...
```

Repeat for each organization in your system (or wire it into your org
sign-up flow later so it happens automatically for new orgs).

---

## STEP 7 — Wire the design system into your layout

1. Open `app/globals.css` and add this as the very first line:
   ```css
   @import "../styles/design-tokens.css";
   ```
2. Open your root layout (`app/layout.tsx`) and load the fonts. If you
   don't already have font loading set up, add this near the top:
   ```ts
   import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

   const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display-loaded" });
   const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body-loaded" });
   const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-data-loaded" });
   ```
   and add `className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}` to your `<body>` tag.
3. Everywhere you render the dashboard shell, swap your current
   sidebar import for the new `components/dashboard/Sidebar.tsx`, and
   use `<StatCard label="Documents" value={2} tone="valid" />` in
   place of your current stat tiles.

---

## STEP 8 — Test it end to end

1. Start your dev server: `npm run dev`
2. Create a new document through your dashboard as normal.
3. Open Prisma Studio (`npx prisma studio`) and check the `document`
   row you just created — `contentHash`, `signature`, and `signedAt`
   should all be filled in. If they're blank, the org key from Step 6
   wasn't found — double check the `organizationId` you used matches.
4. Copy that document's `verificationCode` and visit:
   ```
   http://localhost:3000/verify/<the-code>
   ```
   You should see the scan animation, then a "Verified" stamp with
   the document details.
5. In phpMyAdmin, manually edit that document's `title` field directly
   in the database (bypassing your app entirely) and reload the
   verify page. It should now say **Tampered** — that's the signature
   check catching a change your API didn't make. That's the proof the
   security layer actually works, not just that the happy path works.

---

## If something breaks

Send me the exact error message and which step you were on — with the
terminal output or the browser console error, I'll tell you exactly
what's wrong rather than guessing. The most common first-run issues
are: `FIRMATEL_MASTER_KEY` not set (Step 2), import path mismatch
(Step 4), or the org key not generated yet (Step 6) — check those
three first.
