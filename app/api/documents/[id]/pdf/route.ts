import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { GenericDocumentPdf, DocumentData } from "@/lib/pdf/GenericDocumentPdf";
import { resolveTemplate } from "@/lib/pdf/templateDefaults";
import { TemplateConfig } from "@/lib/pdf/templateTypes";
import { generateVerificationQr } from "@/lib/security/qr";
import { generateBarcode } from "@/lib/security/barcode";

// REPLACES your current app/api/documents/[id]/pdf/route.ts.
// FIX: GenericDocumentPdf is now an async component (it awaits font
// verification before rendering) — so we build its element with
// `await GenericDocumentPdf(...)` instead of `React.createElement`,
// since createElement can't await. This is the required change to
// match the new font-safety system.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { recipient: true, organization: true },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const savedTemplate = await prisma.documentTemplate.findFirst({
    where: { organizationId: doc.organizationId, documentType: doc.documentType, isActive: true },
    orderBy: { version: "desc" },
  });

  const config: TemplateConfig = resolveTemplate(
    doc.documentType,
    doc.organization.primaryColor,
    (savedTemplate?.layout as Partial<TemplateConfig>) ?? null
  );

  const qrDataUri = await generateVerificationQr(doc.verificationCode);
  const barcodeDataUri = config.security.barcode ? await generateBarcode(doc.documentNumber) : null;

  const data: DocumentData = {
    orgName: doc.organization.name,
    orgLogoUrl: doc.organization.logoUrl,
    documentType: doc.documentType,
    title: doc.title,
    description: doc.description,
    documentNumber: doc.documentNumber,
    recipientName: doc.recipient?.fullName ?? null,
    recipientPhotoUrl: (doc.recipient as any)?.photoUrl ?? null,
    issueDate: doc.issueDate.toISOString(),
    expiryDate: doc.expiryDate ? doc.expiryDate.toISOString() : null,
    verificationCode: doc.verificationCode,
    qrDataUri,
    barcodeDataUri,
    isSigned: Boolean(doc.contentHash && doc.signature),
  };

  const element = await GenericDocumentPdf({ config, data });
  const buffer = await renderToBuffer(element);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.documentNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
