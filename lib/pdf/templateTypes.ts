/**
 * lib/pdf/templateTypes.ts
 *
 * REPLACES your current lib/pdf/templateTypes.ts. FontChoice is now
 * `string` instead of a fixed 4-option union, since the font catalog
 * has ~30 options now (see lib/pdf/fonts.ts for the actual list) —
 * validity is checked at render time by resolveFontFamily, not by
 * the type system.
 */

export type PageSizeKey = "A4" | "A5" | "LETTER" | "CARD" | "TICKET" | "RECEIPT";
export type Orientation = "portrait" | "landscape";
export type ShapeStyle = "bordered" | "card" | "ticket";
export type CornerStyle = "square" | "rounded";
export type FrameStyle = "none" | "single" | "double" | "ornate";
export type PhotoShape = "rectangle" | "circle";
export type ContentDensity = "compact" | "normal" | "spacious";
export type FontChoice = string; // catalog key (see lib/pdf/fonts.ts) or "custom"

export const PAGE_DIMENSIONS: Record<PageSizeKey, { width: number; height: number }> = {
  A4: { width: 595.28, height: 841.89 },
  A5: { width: 419.53, height: 595.28 },
  LETTER: { width: 612, height: 792 },
  CARD: { width: 153, height: 242 },
  TICKET: { width: 200, height: 550 },
  RECEIPT: { width: 300, height: 550 },
};

export function resolveDimensions(pageSize: PageSizeKey, orientation: Orientation) {
  const base = PAGE_DIMENSIONS[pageSize];
  return orientation === "landscape" ? { width: base.height, height: base.width } : base;
}

export const DENSITY_SCALE: Record<ContentDensity, number> = {
  compact: 0.65,
  normal: 1,
  spacious: 1.4,
};

export const FIELD_KEYS = [
  "recipientName",
  "description",
  "documentNumber",
  "issueDate",
  "expiryDate",
  "verificationCode",
] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];

export interface TemplateFieldConfig {
  key: FieldKey;
  label: string;
  show: boolean;
}

export const DEFAULT_FIELD_LABELS: Record<FieldKey, string> = {
  recipientName: "Issued to",
  description: "Description",
  documentNumber: "Document No.",
  issueDate: "Issue Date",
  expiryDate: "Expires",
  verificationCode: "Verification Code",
};

export function defaultFields(shown: FieldKey[]): TemplateFieldConfig[] {
  return FIELD_KEYS.map((key) => ({ key, label: DEFAULT_FIELD_LABELS[key], show: shown.includes(key) }));
}

export interface SecurityFeatures {
  qrCode: boolean;
  barcode: boolean;
  watermark: boolean;
  watermarkText: string;
  microprint: boolean;
  microprintText: string;
  securityThreads: boolean;
  threadCount: number;
  specialInk: boolean;
  hologramSeal: boolean;
  digitalSignatureSeal: boolean;
}

export function defaultSecurity(overrides: Partial<SecurityFeatures> = {}): SecurityFeatures {
  return {
    qrCode: true,
    barcode: false,
    watermark: false,
    watermarkText: "ORIGINAL",
    microprint: false,
    microprintText: "AUTHENTIC",
    securityThreads: false,
    threadCount: 2,
    specialInk: false,
    hologramSeal: false,
    digitalSignatureSeal: true,
    ...overrides,
  };
}

export interface TemplateConfig {
  documentType: string;

  pageSize: PageSizeKey;
  orientation: Orientation;
  shape: ShapeStyle;
  cornerStyle: CornerStyle;
  frameStyle: FrameStyle;
  contentDensity: ContentDensity;

  fontFamily: FontChoice;
  customFontName: string;
  customFontUrl: string;
  fontScale: number;

  inkColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundImageUrl: string | null;

  eyebrowText: string;
  showLogo: boolean;
  showGuilloche: boolean;
  showPhoto: boolean;
  photoShape: PhotoShape;
  fields: TemplateFieldConfig[];

  security: SecurityFeatures;
}
