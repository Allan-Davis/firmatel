/**
 * scripts/check-latest-document.ts
 *
 * Confirms whether your most recently created document actually got
 * signed. Documents created BEFORE the signing code was added will
 * correctly show "NOT SIGNED" — that's expected for old records, not
 * a bug. Only documents created after actions.tsx had the signing
 * block (which it already does) should show as signed.
 *
 * Usage: npx tsx scripts/check-latest-document.ts
 */

import { prisma } from "../lib/prisma";

async function main() {
  const doc = await prisma.document.findFirst({
    orderBy: { createdAt: "desc" },
    include: { recipient: true, organization: { include: { key: true } } },
  });

  if (!doc) {
    console.log("No documents found.");
    return;
  }

  console.log(`\nMost recent document: "${doc.title}" (${doc.documentNumber})`);
  console.log(`Created: ${doc.createdAt.toISOString()}`);
  console.log(`Organization has signing key: ${doc.organization?.key ? "YES" : "NO"}`);
  console.log(`contentHash: ${doc.contentHash ?? "(none)"}`);
  console.log(`signature:   ${doc.signature ? doc.signature.slice(0, 40) + "..." : "(none)"}`);
  console.log(`signedAt:    ${doc.signedAt ?? "(none)"}`);
  console.log(
    doc.contentHash && doc.signature
      ? "\n✅ This document IS cryptographically signed.\n"
      : "\n⚠️  This document is NOT signed — check that the org key exists and actions.tsx ran the signing block without error.\n"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
