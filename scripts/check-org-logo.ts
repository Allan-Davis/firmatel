/**
 * scripts/check-org-logo.ts
 *
 * Usage: npx tsx scripts/check-org-logo.ts
 *
 * Tells you definitively what's stored for your organization's logo
 * right now — including the exact thing that breaks PDF rendering
 * (an SVG data URI) if that's what's there.
 */

import { prisma } from "../lib/prisma";

async function main() {
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true, logoUrl: true },
  });

  for (const org of orgs) {
    console.log(`\n${org.name} (${org.id})`);
    if (!org.logoUrl) {
      console.log("  logoUrl: (empty — nothing uploaded/saved)");
      continue;
    }
    const mimeMatch = org.logoUrl.match(/^data:([^;]+);/);
    const mime = mimeMatch ? mimeMatch[1] : "unknown format";
    console.log(`  logoUrl: present, ${org.logoUrl.length} characters, type: ${mime}`);
    if (mime === "image/svg+xml") {
      console.log("  ⚠️  THIS IS THE BUG — PDF generation cannot embed SVG images.");
      console.log("     Re-upload this logo as a PNG or JPEG to fix it.");
    } else if (mime === "image/png" || mime === "image/jpeg") {
      console.log("  ✅ Format is PDF-compatible. If it's still not showing, check that");
      console.log("     'Show organization logo' is ON in that document type's template.");
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
