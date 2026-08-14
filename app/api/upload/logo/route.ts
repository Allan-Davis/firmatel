import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildChainedEntry } from "@/lib/security/audit-chain";

// REPLACES your current app/api/upload/logo/route.ts.
// FIX: removed "image/svg+xml" from allowed types. SVGs preview
// fine in a browser (which is why the upload looked successful),
// but the PDF engine (pdfkit, underneath @react-pdf/renderer) can
// only embed raster images (JPEG/PNG), not vector SVG — so an SVG
// logo silently failed to appear on generated documents. PNG is
// recommended if your logo has transparency; JPEG/WebP also work.
export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PNG, JPEG, or WebP (SVG can't be embedded in PDFs — convert it to PNG first)." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large. Max 2MB." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  await prisma.organization.update({
    where: { id: session.organizationId },
    data: { logoUrl: dataUri },
  });

  const lastEntry = await prisma.auditLog.findFirst({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });
  const auditEntry = {
    organizationId: session.organizationId,
    action: "LOGO_UPDATED",
    entityType: "Organization",
    entityId: session.organizationId,
    description: `Organization logo was updated (${(file.size / 1024).toFixed(0)}KB, ${file.type})`,
    createdAt: new Date(),
  };
  const { previousHash, entryHash } = buildChainedEntry(auditEntry, lastEntry?.entryHash ?? null);
  await prisma.auditLog.create({ data: { ...auditEntry, previousHash, entryHash } });

  return NextResponse.json({ success: true, logoUrl: dataUri });
}
