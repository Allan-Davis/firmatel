/**
 * lib/pdf/templateDefaults.ts
 *
 * REPLACES your current lib/pdf/templateDefaults.ts. Every type now
 * has its own starting security profile — e.g. an ID gets a
 * watermark + microprint + barcode by default (like a real ID card),
 * a Receipt gets almost nothing (receipts don't need holograms).
 * ALL of it is editable per org per type from the template editor —
 * these are starting points, not fixed behavior.
 */

import { TemplateConfig, defaultFields, defaultSecurity } from "./templateTypes";

const INK_DEFAULT = "#10151c";
const ACCENT_DEFAULT = "#c9a34e";
const PAPER_DEFAULT = "#faf9f5";

function base(overrides: Partial<TemplateConfig>): TemplateConfig {
  return {
    documentType: "OTHER",
    pageSize: "A4",
    orientation: "portrait",
    shape: "bordered",
    cornerStyle: "square",
    frameStyle: "double",
    contentDensity: "normal",
    fontFamily: "Helvetica",
    customFontName: "",
    customFontUrl: "",
    fontScale: 1,
    inkColor: INK_DEFAULT,
    accentColor: ACCENT_DEFAULT,
    backgroundColor: PAPER_DEFAULT,
    backgroundImageUrl: null,
    eyebrowText: "THIS DOCUMENT CERTIFIES",
    showLogo: true,
    showGuilloche: true,
    showPhoto: false,
    photoShape: "rectangle",
    fields: defaultFields(["recipientName", "description", "documentNumber", "issueDate", "expiryDate", "verificationCode"]),
    security: defaultSecurity(),
    ...overrides,
  };
}

export const DEFAULT_TEMPLATES: Record<string, TemplateConfig> = {
  CERTIFICATE: base({
    documentType: "CERTIFICATE",
    pageSize: "A4",
    orientation: "landscape",
    shape: "bordered",
    frameStyle: "double",
    fontFamily: "Times-Roman",
    eyebrowText: "THIS DOCUMENT CERTIFIES",
    security: defaultSecurity({ watermark: true, watermarkText: "ORIGINAL", hologramSeal: true, digitalSignatureSeal: true }),
  }),
  LICENCE: base({
    documentType: "LICENCE",
    pageSize: "A5",
    orientation: "portrait",
    fontFamily: "Times-Roman",
    frameStyle: "double",
    eyebrowText: "THIS LICENCE AUTHORIZES",
    security: defaultSecurity({ watermark: true, watermarkText: "LICENCE", microprint: true, securityThreads: true, threadCount: 2, digitalSignatureSeal: true }),
  }),
  PERMIT: base({
    documentType: "PERMIT",
    pageSize: "A5",
    orientation: "portrait",
    fontFamily: "Helvetica",
    frameStyle: "single",
    eyebrowText: "THIS PERMIT GRANTS",
    security: defaultSecurity({ microprint: true, securityThreads: true, threadCount: 1, digitalSignatureSeal: true }),
  }),
  LETTER: base({
    documentType: "LETTER",
    pageSize: "LETTER",
    orientation: "portrait",
    fontFamily: "Helvetica",
    frameStyle: "none",
    showGuilloche: false,
    eyebrowText: "OFFICIAL CORRESPONDENCE",
    fields: defaultFields(["recipientName", "description", "documentNumber", "issueDate", "verificationCode"]),
    security: defaultSecurity({ digitalSignatureSeal: true }),
  }),
  ID: base({
    documentType: "ID",
    pageSize: "CARD",
    orientation: "landscape",
    shape: "card",
    cornerStyle: "rounded",
    frameStyle: "single",
    fontFamily: "Helvetica",
    eyebrowText: "IDENTIFICATION",
    showPhoto: true,
    photoShape: "rectangle",
    fields: defaultFields(["recipientName", "documentNumber", "issueDate", "expiryDate", "verificationCode"]),
    security: defaultSecurity({ watermark: true, watermarkText: "ID", microprint: true, securityThreads: true, threadCount: 2, barcode: true }),
  }),
  BADGE: base({
    documentType: "BADGE",
    pageSize: "CARD",
    orientation: "portrait",
    shape: "card",
    cornerStyle: "rounded",
    fontFamily: "Helvetica",
    eyebrowText: "ACCESS BADGE",
    showPhoto: true,
    photoShape: "circle",
    fields: defaultFields(["recipientName", "documentNumber", "expiryDate", "verificationCode"]),
    security: defaultSecurity({ barcode: true }),
  }),
  PASS: base({
    documentType: "PASS",
    pageSize: "CARD",
    orientation: "landscape",
    shape: "card",
    cornerStyle: "rounded",
    fontFamily: "Helvetica",
    eyebrowText: "AUTHORIZED PASS",
    showPhoto: true,
    photoShape: "rectangle",
    fields: defaultFields(["recipientName", "documentNumber", "issueDate", "expiryDate", "verificationCode"]),
    security: defaultSecurity({ securityThreads: true, threadCount: 1, barcode: true }),
  }),
  ACCESS: base({
    documentType: "ACCESS",
    pageSize: "CARD",
    orientation: "landscape",
    shape: "card",
    cornerStyle: "rounded",
    fontFamily: "Helvetica",
    eyebrowText: "ACCESS AUTHORIZATION",
    showPhoto: true,
    fields: defaultFields(["recipientName", "documentNumber", "expiryDate", "verificationCode"]),
    security: defaultSecurity({ barcode: true }),
  }),
  ADMISSION: base({
    documentType: "ADMISSION",
    pageSize: "TICKET",
    orientation: "landscape",
    shape: "ticket",
    fontFamily: "Helvetica",
    eyebrowText: "ADMIT ONE",
    fields: defaultFields(["recipientName", "documentNumber", "issueDate", "verificationCode"]),
    security: defaultSecurity({ barcode: true }),
  }),
  EVENT: base({
    documentType: "EVENT",
    pageSize: "TICKET",
    orientation: "landscape",
    shape: "ticket",
    fontFamily: "Helvetica",
    eyebrowText: "EVENT TICKET",
    fields: defaultFields(["recipientName", "description", "documentNumber", "issueDate", "verificationCode"]),
    security: defaultSecurity({ barcode: true, securityThreads: true, threadCount: 1 }),
  }),
  RECEIPT: base({
    documentType: "RECEIPT",
    pageSize: "RECEIPT",
    orientation: "portrait",
    shape: "card",
    fontFamily: "Courier",
    showLogo: false,
    showGuilloche: false,
    frameStyle: "none",
    eyebrowText: "RECEIPT",
    fields: defaultFields(["recipientName", "description", "documentNumber", "issueDate", "verificationCode"]),
    security: defaultSecurity({ qrCode: true, digitalSignatureSeal: false }),
  }),
  OTHER: base({}),
};

export function getBaseTemplate(documentType: string): TemplateConfig {
  const key = documentType.toUpperCase();
  return DEFAULT_TEMPLATES[key] ?? DEFAULT_TEMPLATES.OTHER;
}

export function resolveTemplate(
  documentType: string,
  orgPrimaryColor: string | null | undefined,
  savedLayout: Partial<TemplateConfig> | null | undefined
): TemplateConfig {
  const defaults = getBaseTemplate(documentType);
  const withOrgBrand: TemplateConfig = { ...defaults, accentColor: orgPrimaryColor || defaults.accentColor };

  if (!savedLayout) return withOrgBrand;

  return {
    ...withOrgBrand,
    ...savedLayout,
    fields: savedLayout.fields ?? withOrgBrand.fields,
    security: { ...withOrgBrand.security, ...(savedLayout.security ?? {}) },
  };
}
