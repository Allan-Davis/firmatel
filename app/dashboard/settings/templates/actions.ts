"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TemplateConfig, FIELD_KEYS, DEFAULT_FIELD_LABELS, FieldKey } from "@/lib/pdf/templateTypes";
import { getBaseTemplate } from "@/lib/pdf/templateDefaults";
import { buildChainedEntry } from "@/lib/security/audit-chain";

// REPLACES your current app/dashboard/settings/templates/actions.ts.
// Adds: parsing for contentDensity, and a chained audit log entry
// whenever a template is saved.
export async function saveTemplateAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const documentType = formData.get("documentType")?.toString();
  if (!documentType) throw new Error("Missing document type.");

  const base = getBaseTemplate(documentType);

  const fields = FIELD_KEYS.map((key: FieldKey) => ({
    key,
    label: DEFAULT_FIELD_LABELS[key],
    show: formData.get(`field_${key}`) === "on",
  }));

  const config: TemplateConfig = {
    documentType,
    pageSize: (formData.get("pageSize")?.toString() as TemplateConfig["pageSize"]) || base.pageSize,
    orientation: (formData.get("orientation")?.toString() as TemplateConfig["orientation"]) || base.orientation,
    shape: (formData.get("shape")?.toString() as TemplateConfig["shape"]) || base.shape,
    cornerStyle: (formData.get("cornerStyle")?.toString() as TemplateConfig["cornerStyle"]) || base.cornerStyle,
    frameStyle: (formData.get("frameStyle")?.toString() as TemplateConfig["frameStyle"]) || base.frameStyle,
    contentDensity: (formData.get("contentDensity")?.toString() as TemplateConfig["contentDensity"]) || base.contentDensity,

    fontFamily: (formData.get("fontFamily")?.toString() as TemplateConfig["fontFamily"]) || base.fontFamily,
    customFontName: formData.get("customFontName")?.toString() || "",
    customFontUrl: formData.get("customFontUrl")?.toString() || "",
    fontScale: parseFloat(formData.get("fontScale")?.toString() || "1") || 1,

    inkColor: formData.get("inkColor")?.toString() || base.inkColor,
    accentColor: formData.get("accentColor")?.toString() || base.accentColor,
    backgroundColor: formData.get("backgroundColor")?.toString() || base.backgroundColor,
    backgroundImageUrl: formData.get("backgroundImageUrl")?.toString() || null,

    eyebrowText: formData.get("eyebrowText")?.toString() || base.eyebrowText,
    showLogo: formData.get("showLogo") === "on",
    showGuilloche: formData.get("showGuilloche") === "on",
    showPhoto: formData.get("showPhoto") === "on",
    photoShape: (formData.get("photoShape")?.toString() as TemplateConfig["photoShape"]) || base.photoShape,
    fields,

    security: {
      qrCode: formData.get("security_qrCode") === "on",
      barcode: formData.get("security_barcode") === "on",
      watermark: formData.get("security_watermark") === "on",
      watermarkText: formData.get("watermarkText")?.toString() || "ORIGINAL",
      microprint: formData.get("security_microprint") === "on",
      microprintText: formData.get("microprintText")?.toString() || "AUTHENTIC",
      securityThreads: formData.get("security_securityThreads") === "on",
      threadCount: Math.max(1, Math.min(6, parseInt(formData.get("threadCount")?.toString() || "2", 10) || 2)),
      specialInk: formData.get("security_specialInk") === "on",
      hologramSeal: formData.get("security_hologramSeal") === "on",
      digitalSignatureSeal: formData.get("security_digitalSignatureSeal") === "on",
    },
  };

  const existing = await prisma.documentTemplate.findFirst({
    where: { organizationId: session.organizationId, documentType, isActive: true },
  });

  if (existing) {
    await prisma.documentTemplate.update({
      where: { id: existing.id },
      data: { layout: config as any, version: existing.version + 1 },
    });
  } else {
    await prisma.documentTemplate.create({
      data: {
        organizationId: session.organizationId,
        documentType,
        name: `${documentType} template`,
        layout: config as any,
      },
    });
  }

  const lastEntry = await prisma.auditLog.findFirst({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });
  const auditEntry = {
    organizationId: session.organizationId,
    action: "TEMPLATE_UPDATED",
    entityType: "DocumentTemplate",
    entityId: documentType,
    description: `${documentType} document template was customized`,
    createdAt: new Date(),
  };
  const { previousHash, entryHash } = buildChainedEntry(auditEntry, lastEntry?.entryHash ?? null);
  await prisma.auditLog.create({ data: { ...auditEntry, previousHash, entryHash } });

  revalidatePath("/dashboard/settings/templates");
  redirect("/dashboard/settings/templates");
}
