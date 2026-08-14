/**
 * scripts/list-organizations.ts
 *
 * Prisma Studio's UI currently has a known bug with MariaDB (Prisma
 * v7 sends MySQL-8-only JSON syntax Studio's browser view chokes on).
 * Your actual database connection works fine though — this script
 * proves it and gives you organization IDs without touching Studio.
 *
 * Usage:
 *   npx tsx scripts/list-organizations.ts
 */

import { prisma } from "../lib/db/prisma";

async function main() {
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true, slug: true, status: true },
  });

  if (orgs.length === 0) {
    console.log("No organizations found.");
    return;
  }

  console.log("\nOrganizations:\n");
  for (const org of orgs) {
    console.log(`  ${org.name}  (${org.status})`);
    console.log(`    id:   ${org.id}`);
    console.log(`    slug: ${org.slug}\n`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
