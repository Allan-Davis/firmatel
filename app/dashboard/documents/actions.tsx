"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { issueSignature } from "@/lib/security/signing";
import { buildChainedEntry } from "@/lib/security/audit-chain";

// REPLACES your current app/dashboard/documents/actions.tsx.
// Only change from your version: recipient creation now also
// accepts an optional "recipientPhoto" file field and stores it as
// a base64 data URI on recipient.photoUrl. Everything else —
// signing, audit chain, redirect — is untouched from your original.

export async function createDocumentAction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const documentType = formData.get("documentType")?.toString().trim();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const recipientName = formData.get("recipientName")?.toString().trim() || null;
  const recipientEmail = formData.get("recipientEmail")?.toString().trim() || null;
  const expiryDateRaw = formData.get("expiryDate")?.toString().trim();
  const recipientPhoto = formData.get("recipientPhoto");

  if (!documentType || !title) {
    throw new Error("Document type and title are required.");
  }

  const organizationId = session.organizationId;

  let recipientId: string | null = null;
  if (recipientName) {
    let photoUrl: string | null = null;

    if (recipientPhoto instanceof File && recipientPhoto.size > 0) {
      const allowed = ["image/png", "image/jpeg", "image/webp"];
      if (allowed.includes(recipientPhoto.type) && recipientPhoto.size <= 2 * 1024 * 1024) {
        const bytes = await recipientPhoto.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        photoUrl = `data:${recipientPhoto.type};base64,${base64}`;
      }
      // Silently skip an invalid/oversized photo rather than failing
      // the whole document creation — the document still gets
      // created, just without a photo.
    }

    const recipient = await prisma.recipient.create({
      data: {
        organizationId,
        fullName: recipientName,
        email: recipientEmail,
        ...(photoUrl ? { photoUrl } : {}),
      } as any,
    });
    recipientId = recipient.id;
  }

  const documentNumber = `DOC-${Date.now()}`;
  const verificationCode = crypto.randomBytes(16).toString("hex");

  const doc = await prisma.document.create({
    data: {
      organizationId,
      recipientId,
      documentNumber,
      documentType,
      title,
      description,
      expiryDate: expiryDateRaw ? new Date(expiryDateRaw) : null,
      status: "ISSUED",
      verificationCode,
    },
    include: { recipient: true },
  });

  const orgKey = await prisma.organizationKey.findUnique({
    where: { organizationId },
  });

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

  const { previousHash, entryHash } = buildChainedEntry(auditEntry, lastEntry?.entryHash ?? null);

  await prisma.auditLog.create({
    data: { ...auditEntry, previousHash, entryHash },
  });

  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard");
  redirect(`/dashboard/documents`);
}
