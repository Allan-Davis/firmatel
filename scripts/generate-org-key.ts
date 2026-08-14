/**
 * scripts/generate-org-key.ts
 * FIXED: now imports your project's real Prisma client at
 * @/lib/prisma instead of the duplicate one at lib/db/prisma.ts.
 * You can delete lib/db/prisma.ts now — it's no longer used anywhere.
 *
 * Usage:
 *   npx tsx scripts/generate-org-key.ts <organizationId>
 */

import "dotenv/config";
import { prisma } from "../lib/prisma";
import { generateOrganizationKeypair } from "../lib/security/signing";

async function main() {
  const organizationId = process.argv[2];
  if (!organizationId) {
    console.error("Usage: npx tsx scripts/generate-org-key.ts <organizationId>");
    process.exit(1);
  }

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) {
    console.error(`No organization found with id ${organizationId}`);
    process.exit(1);
  }

  const existing = await prisma.organizationKey.findUnique({ where: { organizationId } });
  if (existing) {
    console.error(`Organization ${org.name} already has a key (version ${existing.keyVersion}). Aborting.`);
    process.exit(1);
  }

  const { publicKey, privateKeyEnc } = generateOrganizationKeypair();

  await prisma.organizationKey.create({
    data: { organizationId, publicKey, privateKeyEnc, keyVersion: 1 },
  });

  console.log(`Signing key created for organization: ${org.name}`);
  console.log(`Public key (safe to log/share): ${publicKey.slice(0, 40)}...`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());