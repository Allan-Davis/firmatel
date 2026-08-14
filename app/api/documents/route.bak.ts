import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { issueSignature } from "@/lib/security/signing";
import { buildChainedEntry } from "@/lib/security/audit-chain";

// POST /api/documents
// REFERENCE FILE: if you already have app/api/documents/route.ts,
// don't overwrite it blindly — copy the SIGNING and AUDIT LOG
// sections below into your existing handler, right after the
// document row is created. This file shows the complete, correct
// order of operations so you can see how the pieces fit together.

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { organizationId, recipientId, documentType, title, description, expiryDate } = body;

  if (!organizationId || !documentType || !title) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // 1. Generate the human-facing identifiers your app already uses.
  const documentNumber = `DOC-${Date.now()}`;
  const verificationCode = crypto.randomBytes(16).toString("hex");

  // 2. Create the document row.
  const doc = await prisma.document.create({
    data: {
      organizationId,
      recipientId: recipientId ?? null,
      documentNumber,
      documentType,
      title,
      description: description ?? null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status: "ISSUED",
      verificationCode,
    },
    include: { recipient: true },
  });

  // 3. SIGN IT — this is the new step. Look up the org's keypair
  //    (created once via scripts/generate-org-key.ts) and sign the
  //    document's canonical content.
  const orgKey = await prisma.organizationKey.findUnique({ where: { organizationId } });

  if (orgKey) {
    const { contentHash, signature, signedAt } = issueSignature(
      {
        organizationId,
        documentNumber: doc.documentNumber,
        documentType: doc.documentType,
        title: doc.title,
        recipientName: doc.recipient?.fullName ?? null,
        issueDate: doc.issueDate.toISOString(),
        status: doc.status,
      },
      orgKey.privateKeyEnc
    );

    await prisma.document.update({
      where: { id: doc.id },
      data: { contentHash, signature, signedAt, keyVersion: orgKey.keyVersion },
    });
  }

  // 4. AUDIT LOG — chained, so this entry links to the previous one.
  const lastEntry = await prisma.auditLog.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  const auditEntry = {
    organizationId,
    action: "DOCUMENT_ISSUED",
    entityType: "Document",
    entityId: doc.id,
    description: `Issued "${doc.title}" (${doc.documentNumber})`,
    createdAt: new Date(),
  };

  const { previousHash, entryHash } = buildChainedEntry(
    auditEntry,
    lastEntry?.entryHash ?? null
  );

  await prisma.auditLog.create({
    data: { ...auditEntry, previousHash, entryHash },
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}
