# Firmatel

**Secure document infrastructure for institutions that issue certificates, IDs, licences, and credentials.**

Firmatel replaces static templates and unverifiable PDFs with a document system built on real cryptography: every issued document is signed with your organization's private key, embedded with a live QR code, and verifiable in real time — so a photocopy or edited PDF can never pass as authentic.

Built with Next.js, Prisma, and MariaDB.

---

## Why Firmatel

Most "secure" document systems rely on a serial number and a lookup page — which proves nothing beyond "a row with this ID exists." Firmatel is built around a different guarantee: **the document's content is cryptographically signed at issuance**, and verification recomputes that signature from the live database record every time. If a document's title, recipient, or status changes — through the app or a direct database edit — the signature stops matching, and verification reports `TAMPERED` instead of `VALID`.

## Core features

### Cryptographic authenticity
- **Ed25519 signing** — every document, credential, and ticket is signed at issuance using a per-organization keypair. Private keys are encrypted at rest (AES-256-GCM) and never leave the server.
- **Tamper-evident audit log** — every action is chained by hash (like a lightweight blockchain), so editing historical records is mathematically detectable, not just logged and trusted.
- **Live verification** — public `/verify/<code>` pages and an in-dashboard admin lookup tool both re-check the signature against the current database state on every request. Nothing is cached.

### Document generation
- **Customizable templates per document type** — Certificates, IDs, Licences, Permits, Letters, Badges, Passes, Tickets, and more each get their own layout (full-page, card, or ticket shape), independently configurable per organization.
- **30+ fonts** across formal serif, calligraphy/script, old-world/blackletter, and monospace styles — with automatic fallback if a font source becomes unreachable, so a bad font never breaks generation.
- **Full branding control** — logo upload, brand colors, fonts, frame styles, corner styles, and content density, all per document type.
- **Security feature stack** — QR codes, real scannable barcodes, watermarks, scattered curved microprinting, security thread overlays, metallic hologram foil strips, and visual digital-signature seals — each individually toggleable per document type, not bundled as one fixed look.
- **PDF-level protection** — generated PDFs carry real owner-password permissions (no modifying, no copying) using PDF's native security model.
- **Passport photo support** — recipient photos on ID-style documents, uploaded at issuance.

### Operations
- Sortable, filterable, searchable document management (by type, status, issue date, expiry date).
- Paginated, searchable audit log with live chain-integrity verification.
- Organization-wide settings: branding, document numbering, verification policy, regional format.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router, Server Actions) |
| Database | MariaDB via Prisma ORM |
| PDF generation | `@react-pdf/renderer` |
| Cryptography | Node `crypto` (Ed25519, AES-256-GCM, SHA-256) |
| QR / Barcode | `qrcode`, `bwip-js` |

## Getting started

```bash
git clone https://github.com/Allan-Davis/firmatel.git
cd firmatel
npm install
```

Set up your environment:

```bash
cp .env.example .env
```

Fill in `.env`:
```
DATABASE_URL="mysql://user:password@localhost:3306/firmatel"
FIRMATEL_MASTER_KEY=<generate with the command below>
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate a master key (used to encrypt organization signing keys at rest):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Apply the database schema:
```bash
npx prisma migrate dev
npx prisma generate
```

Generate a signing keypair for your organization:
```bash
npx tsx scripts/generate-org-key.ts <your-organization-id>
```

Run the app:
```bash
npm run dev
```

## Security notes

- `FIRMATEL_MASTER_KEY` must never be committed or exposed client-side — it's the root key protecting every organization's signing capability. Treat it like a production database password.
- `.env` is excluded from version control by default — verify this before your first push.
- Document PDF permissions restrict editing/copying in compliant readers but cannot prevent visual recreation (e.g. screenshotting). The actual authenticity guarantee is the live signature check at `/verify`, not the PDF file itself.

## License

Proprietary — All rights reserved.
