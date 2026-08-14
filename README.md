# Firmatel Security & Design Upgrade

This is a drop-in package for your existing Next.js + Prisma + MariaDB
project. It adds cryptographic document signing, a tamper-evident
audit log, a template data model, and a redesigned visual identity.
Nothing here replaces your existing tables — it extends them.

## What's in here

```
prisma/schema-additions.prisma   # models + fields to add to schema.prisma
migrations/2026_security_upgrade.sql   # same, as raw SQL for phpMyAdmin/XAMPP
lib/security/signing.ts          # Ed25519 sign/verify (server-only)
lib/security/audit-chain.ts      # hash-chained audit log
lib/security/guilloche.ts        # deterministic security-pattern generator
styles/design-tokens.css         # the visual identity's CSS variables
components/dashboard/Sidebar.tsx
components/dashboard/StatCard.tsx
app/verify/[code]/page.tsx
app/verify/[code]/VerificationClient.tsx
app/api/verify/[code]/route.ts
```

## Step 1 — Apply the schema changes

Option A (Prisma CLI, recommended):
1. Open your `prisma/schema.prisma`.
2. Add the `OrganizationKey` and `DocumentTemplate` models from
   `prisma/schema-additions.prisma` verbatim.
3. Add the individual fields listed in the comments (`contentHash`,
   `signature`, `signedAt`, `keyVersion`, etc.) to your existing
   `Document`, `Credential`, `Ticket`, `AuditLog`, and
   `VerificationEvent` models.
4. Run:
   ```
   npx prisma migrate dev --name security_upgrade
   ```

Option B (direct SQL): run `migrations/2026_security_upgrade.sql`
against your `firmatel` database in phpMyAdmin, then run
`npx prisma db pull` and `npx prisma generate` to sync the client.

## Step 2 — Generate your master key and per-org keypairs

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Add the output to `.env` as `FIRMATEL_MASTER_KEY`. **Never commit this
file.** Then, for each organization (a one-off script or an admin
action in Settings):

```ts
import { generateOrganizationKeypair } from "@/lib/security/signing";
const { publicKey, privateKeyEnc } = generateOrganizationKeypair();
await prisma.organizationKey.create({
  data: { organizationId, publicKey, privateKeyEnc },
});
```

## Step 3 — Sign documents at issuance

In your existing `POST /api/documents` (and the credential/ticket
equivalents), after the row is created:

```ts
import { issueSignature } from "@/lib/security/signing";

const orgKey = await prisma.organizationKey.findUnique({ where: { organizationId } });
const { contentHash, signature, signedAt } = issueSignature(
  {
    organizationId,
    documentNumber: doc.documentNumber,
    documentType: doc.documentType,
    title: doc.title,
    recipientName: recipient?.fullName ?? null,
    issueDate: doc.issueDate.toISOString(),
    status: doc.status,
  },
  orgKey.privateKeyEnc
);

await prisma.document.update({
  where: { id: doc.id },
  data: { contentHash, signature, signedAt, keyVersion: orgKey.keyVersion },
});
```

Do the same anywhere `status` changes (e.g. revocation) — a new
status means a new hash, which means a new signature. Old signatures
naturally stop validating for the old status, which is correct: the
signature attests to the record *as it currently stands*.

## Step 4 — Wire the audit log

Wherever you currently call `prisma.auditLog.create(...)`, wrap it
with `buildChainedEntry` from `lib/security/audit-chain.ts` (see the
usage example in that file's docstring). Add a "Verify Integrity"
action in `/dashboard/audit` that calls `verifyChain()` over an
organization's entries and shows a pass/fail banner.

## Step 5 — Verification route + page

`app/api/verify/[code]/route.ts` and `app/verify/[code]/` are ready
to use — adjust the import path for your Prisma client
(`@/lib/db` or wherever `PrismaClient` is instantiated in your
project) and the folder name if your existing route uses
`[verificationCode]` instead of `[code]`.

## Step 6 — Visual identity

1. Add `@import "../styles/design-tokens.css";` to the top of your
   `app/globals.css`.
2. Load the two fonts (Fraunces or Newsreader for display, IBM Plex
   Sans for body, IBM Plex Mono for data) via `next/font/google` in
   your root layout.
3. Swap your current sidebar component for
   `components/dashboard/Sidebar.tsx`, and use `StatCard` in place of
   the current dashboard stat tiles.
4. Everywhere else in the dashboard, reuse the CSS variables
   (`var(--ink-900)`, `var(--brass-500)`, etc.) rather than hardcoded
   hex values, so future theme tweaks stay in one file.

## What I'd build next (in order)

1. **Template designer UI** on top of `DocumentTemplate.layout` (a
   JSON canvas: drag fields onto a mm-based page, save positions).
2. **PDF generation** that renders a template + `guilloche.ts`
   background server-side (e.g. via `@react-pdf/renderer` or
   Puppeteer) — same seed as stored in `backgroundSeed` so print
   output matches what was signed.
3. **Anomaly detection** on `VerificationEvent`: geo-IP lookup on
   write, flag `isAnomalous` when the same code is verified from two
   distant locations within a short window.
4. **Bulk issuance** (CSV upload → loop over Step 3 above).

Tell me which of these you want next and I'll build it the same way —
actual files, wired into what's already here.
