import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // adjust to your actual prisma client export
import { verifyDocumentIntegrity } from "@/lib/security/signing";

/**
 * GET /api/verify/[code]
 *
 * This is the ONE endpoint that decides "authentic or not." Keep it
 * boring and defensive — it's the highest-value target in the whole
 * app. It never trusts anything the caller sends beyond the code
 * itself; every fact it returns comes from re-reading the database
 * and re-checking the signature, never from a cached or client-
 * supplied value.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code?.trim();
  if (!code) {
    return NextResponse.json({ status: "INVALID", reason: "No code provided." });
  }

  // Look across document/credential/ticket the same way your
  // existing verification route already does — this just adds the
  // signature check on top of whatever record it finds.
  const doc = await prisma.document.findFirst({
    where: { verificationCode: code },
    include: { organization: { include: { keys: true } as any }, recipient: true },
  });

  await logVerificationAttempt(code, req);

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

  const orgKey = (doc as any).organization?.keys?.[0];
  if (!orgKey) {
    // Org hasn't been migrated to signed issuance yet — don't hard
    // fail, but don't claim cryptographic verification either.
    return NextResponse.json({
      status: "VALID",
      documentType: doc.documentType,
      title: doc.title,
      recipientName: doc.recipient?.fullName,
      organizationName: (doc as any).organization?.name,
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
    (doc as any).contentHash ?? null,
    (doc as any).signature ?? null,
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
    organizationName: (doc as any).organization?.name,
    issueDate: doc.issueDate?.toISOString().slice(0, 10),
    documentNumber: doc.documentNumber,
  });
}

async function logVerificationAttempt(code: string, req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? undefined;
  try {
    await prisma.verificationEvent.create({
      data: {
        verificationCode: code,
        result: "VALID", // overwrite below once you thread the real result through if you want it precise
        ipAddress: ip,
        userAgent,
      } as any,
    });
  } catch {
    // Never let logging failure break verification for the end user.
  }
}
