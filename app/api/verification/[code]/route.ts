import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyDocumentIntegrity } from "@/lib/security/signing";

// GET /api/verification/[code]
// FIXED: now imports @/lib/prisma to match the rest of the project.

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = params.code?.trim();
  if (!code) {
    return NextResponse.json({ status: "INVALID", reason: "No code provided." });
  }

  const doc = await prisma.document.findFirst({
    where: { verificationCode: code },
    include: {
      organization: { include: { key: true } },
      recipient: true,
    },
  });

  await logVerificationAttempt(code, req, doc ? "VALID" : "INVALID");

  if (!doc) {
    return NextResponse.json({ status: "INVALID", reason: "No record matches this code." });
  }

  if (doc.status === "REVOKED") {
    return NextResponse.json({
      status: "REVOKED",
      documentType: doc.documentType,
      title: doc.title,
      reason: "This document has been revoked by the issuing organization.",
    });
  }

  if (doc.expiryDate && doc.expiryDate < new Date()) {
    return NextResponse.json({ status: "EXPIRED", reason: "This document's validity period has ended." });
  }

  const orgKey = doc.organization?.key;
  if (!orgKey) {
    return NextResponse.json({
      status: "VALID",
      documentType: doc.documentType,
      title: doc.title,
      recipientName: doc.recipient?.fullName,
      organizationName: doc.organization?.name,
      issueDate: doc.issueDate?.toISOString().slice(0, 10),
      documentNumber: doc.documentNumber,
      reason: "Record found. (Cryptographic signature not yet enabled for this organization.)",
    });
  }

  const integrity = verifyDocumentIntegrity(
    {
      organizationId: doc.organizationId,
      documentNumber: doc.documentNumber,
      documentType: doc.documentType,
      title: doc.title,
      recipientName: doc.recipient?.fullName ?? null,
      issueDate: doc.issueDate.toISOString(),
      status: doc.status,
    },
    doc.contentHash,
    doc.signature,
    orgKey.publicKey
  );

  if (integrity.status === "TAMPERED") {
    return NextResponse.json({ status: "TAMPERED", reason: integrity.reason });
  }

  return NextResponse.json({
    status: "VALID",
    documentType: doc.documentType,
    title: doc.title,
    recipientName: doc.recipient?.fullName,
    organizationName: doc.organization?.name,
    issueDate: doc.issueDate?.toISOString().slice(0, 10),
    documentNumber: doc.documentNumber,
  });
}

async function logVerificationAttempt(code: string, req: NextRequest, result: "VALID" | "INVALID") {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? undefined;
  try {
    await prisma.verificationEvent.create({
      data: { verificationCode: code, result, ipAddress: ip, userAgent },
    });
  } catch {
    // Never let logging failure break verification for the end user.
  }
}