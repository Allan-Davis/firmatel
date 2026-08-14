/**
 * lib/pdf/GenericDocumentPdf.tsx
 *
 * REPLACES your current lib/pdf/GenericDocumentPdf.tsx. Changes:
 *  - Microprint now scatters across the whole page on every shape
 *    (bordered/card/ticket), using the new curved/zigzag version.
 *  - Removed the "SECURE DOCUMENT INFRASTRUCTURE" tagline.
 *  - Guards against SVG logos (skips rendering instead of failing
 *    silently) — belt-and-suspenders alongside the upload-side fix.
 *  - <Document> now sets real PDF permissions (owner password +
 *    modifying/copying disabled) — see PDF_PROTECTION note at the
 *    bottom of this file for what that does and doesn't stop.
 *  - fontFamily resolution is now ASYNC (font URLs are verified
 *    reachable before use) — this component is now async and must
 *    be awaited by its caller. The PDF route handles this.
 */

import React from "react";
import { Document, Page, View, Text, Svg, Polygon, Image, StyleSheet } from "@react-pdf/renderer";
import { generateGuillochePoints } from "../security/guilloche";
import { resolveFontFamily } from "./fonts";
import { TemplateConfig, resolveDimensions, FieldKey, DENSITY_SCALE } from "./templateTypes";
import {
  Watermark,
  Microprint,
  SecurityThreads,
  SpecialInkBand,
  HologramStrip,
  DigitalSignatureSeal,
  BarcodeImage,
} from "./SecurityElements";

export interface DocumentData {
  orgName: string;
  orgLogoUrl?: string | null;
  documentType: string;
  title: string;
  description?: string | null;
  documentNumber: string;
  recipientName?: string | null;
  recipientPhotoUrl?: string | null;
  issueDate: string;
  expiryDate?: string | null;
  verificationCode: string;
  qrDataUri: string;
  barcodeDataUri?: string | null;
  isSigned: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function fieldValue(key: FieldKey, data: DocumentData): string | null {
  switch (key) {
    case "recipientName": return data.recipientName ?? null;
    case "description": return data.description ?? null;
    case "documentNumber": return data.documentNumber;
    case "issueDate": return formatDate(data.issueDate);
    case "expiryDate": return data.expiryDate ? formatDate(data.expiryDate) : null;
    case "verificationCode": return data.verificationCode;
  }
}

function frameBorder(style: TemplateConfig["frameStyle"], accentColor: string) {
  if (style === "none") return null;
  if (style === "single") return `1pt solid ${accentColor}`;
  return `1.5pt solid ${accentColor}`;
}

function radiusFor(corner: TemplateConfig["cornerStyle"]) {
  return corner === "rounded" ? 8 : 0;
}

// FIX: an SVG data URI can't be embedded by pdfkit — guard here too,
// in addition to the upload route now refusing SVG uploads, so any
// already-stored SVG logo fails gracefully instead of breaking the
// whole render.
function isPdfSafeImage(url: string | null | undefined): url is string {
  if (!url) return false;
  if (url.startsWith("data:image/svg")) return false;
  return true;
}

function GuillocheBackground({ seed, width, height, accentColor }: { seed: string; width: number; height: number; accentColor: string }) {
  const polygons = generateGuillochePoints({ seed, width, height, lineCount: 14 });
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", top: 0, left: 0 }}>
      {polygons.map((points, i) => (
        <Polygon key={i} points={points} fill="none" stroke={accentColor} strokeWidth={0.6} opacity={0.32} />
      ))}
    </Svg>
  );
}

function PhotoBox({ url, shape, size }: { url: string | null | undefined; shape: TemplateConfig["photoShape"]; size: number }) {
  if (!isPdfSafeImage(url)) {
    return (
      <View style={{ width: size, height: size, borderRadius: shape === "circle" ? size / 2 : 3, backgroundColor: "#e8e4d6", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 6, color: "#9aa4b2" }}>PHOTO</Text>
      </View>
    );
  }
  return <Image src={url} style={{ width: size, height: size, borderRadius: shape === "circle" ? size / 2 : 3, objectFit: "cover" }} />;
}

function SecurityStack({ config, data, width, height }: { config: TemplateConfig; data: DocumentData; width: number; height: number }) {
  const { security, accentColor, inkColor } = config;
  return (
    <>
      {security.watermark && <Watermark text={security.watermarkText} color={inkColor} width={width} height={height} />}
      {security.microprint && <Microprint text={security.microprintText} color={inkColor} width={width} height={height} />}
      {security.securityThreads && <SecurityThreads count={security.threadCount} color={accentColor} width={width} height={height} />}
      {security.specialInk && <SpecialInkBand width={width} accentColor={accentColor} />}
    </>
  );
}

// Now async — resolves the font (with reachability check) before
// building the document tree.
export async function GenericDocumentPdf({ config, data }: { config: TemplateConfig; data: DocumentData }) {
  const { width, height } = resolveDimensions(config.pageSize, config.orientation);
  const visibleFields = config.fields.filter((f) => f.show);
  const fontFamily = await resolveFontFamily(config.fontFamily, config.customFontName, config.customFontUrl);
  const fs = (base: number) => Math.round(base * config.fontScale * 10) / 10;
  const density = DENSITY_SCALE[config.contentDensity] ?? 1;
  const sp = (base: number) => Math.round(base * density);

  const styles = StyleSheet.create({ page: { backgroundColor: config.backgroundColor, fontFamily } });
  const radius = radiusFor(config.cornerStyle);
  const outerBorder = frameBorder(config.frameStyle, config.accentColor);
  const safeLogo = isPdfSafeImage(data.orgLogoUrl) ? data.orgLogoUrl : null;
  const safePhoto = isPdfSafeImage(data.recipientPhotoUrl) ? data.recipientPhotoUrl : null;

  // PDF_PROTECTION: standard PDF owner-password permissions. This
  // blocks modifying/copying in readers that respect PDF permissions
  // (Acrobat, Word's "convert PDF to editable" flow, most PDF
  // editors). It does NOT and cannot stop screenshotting the page and
  // recreating it visually — no digital protection can, for a
  // document that must stay human-readable. The actual defense
  // against forged copies is the signature check at /verify.
  const documentSecurity = {
    ownerPassword: `firmatel-${data.documentNumber}`,
    permissions: {
      printing: "highResolution" as const,
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
      contentAccessibility: true, // keep screen-reader access working
      documentAssembly: false,
    },
  };

  if (config.shape === "card") {
    return (
      <Document {...documentSecurity}>
        <Page size={[width, height]} style={styles.page}>
          {config.backgroundImageUrl && isPdfSafeImage(config.backgroundImageUrl) && (
            <Image src={config.backgroundImageUrl} style={{ position: "absolute", top: 0, left: 0, width, height, objectFit: "cover" }} />
          )}
          {config.showGuilloche && <GuillocheBackground seed={`${data.orgName}:${config.documentType}`} width={width} height={height} accentColor={config.accentColor} />}
          <SecurityStack config={config} data={data} width={width} height={height} />
          {config.security.hologramSeal && <HologramStrip side="right" pageWidth={width} pageHeight={height} thickness={7} />}
          {outerBorder && <View style={{ position: "absolute", top: 6, left: 6, right: 6, bottom: 6, border: outerBorder, borderRadius: radius }} />}

          <View style={{ padding: 14, paddingRight: config.security.hologramSeal ? 20 : 14, flexGrow: 1, justifyContent: "space-between" }}>
            <View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                {config.showLogo && safeLogo ? (
                  <Image src={safeLogo} style={{ width: 20, height: 20, objectFit: "contain" }} />
                ) : (
                  <Text style={{ fontSize: fs(9), fontWeight: 700, color: config.inkColor }}>{data.orgName}</Text>
                )}
                <Text style={{ fontSize: fs(6), color: config.accentColor, letterSpacing: 1 }}>{config.eyebrowText}</Text>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: sp(10) }}>
                {config.showPhoto && <PhotoBox url={safePhoto} shape={config.photoShape} size={44} />}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fs(12), fontWeight: 700, color: config.inkColor }}>{data.title}</Text>
                  {visibleFields.map((f) => {
                    const value = fieldValue(f.key, data);
                    if (!value) return null;
                    return (
                      <View key={f.key} style={{ marginTop: sp(5) }}>
                        <Text style={{ fontSize: fs(5), color: "#5b6472", letterSpacing: 0.5 }}>{f.label.toUpperCase()}</Text>
                        <Text style={{ fontSize: fs(f.key === "recipientName" ? 9 : 7), fontWeight: f.key === "recipientName" ? 700 : 400, color: config.inkColor, marginTop: 1 }}>
                          {value}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
              <View>
                {config.security.digitalSignatureSeal && <DigitalSignatureSeal accentColor={config.accentColor} inkColor={config.inkColor} />}
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                {config.security.barcode && data.barcodeDataUri && <BarcodeImage dataUri={data.barcodeDataUri} width={70} />}
                {config.security.qrCode && <Image src={data.qrDataUri} style={{ width: 34, height: 34 }} />}
              </View>
            </View>
          </View>
        </Page>
      </Document>
    );
  }

  if (config.shape === "ticket") {
    return (
      <Document {...documentSecurity}>
        <Page size={[width, height]} style={styles.page}>
          {config.backgroundImageUrl && isPdfSafeImage(config.backgroundImageUrl) && (
            <Image src={config.backgroundImageUrl} style={{ position: "absolute", top: 0, left: 0, width, height, objectFit: "cover" }} />
          )}
          {config.showGuilloche && <GuillocheBackground seed={`${data.orgName}:${config.documentType}`} width={width} height={height} accentColor={config.accentColor} />}
          <SecurityStack config={config} data={data} width={width} height={height} />
          {config.security.hologramSeal && <HologramStrip side="top" pageWidth={width} pageHeight={height} thickness={9} />}
          {outerBorder && <View style={{ position: "absolute", top: 8, left: 8, right: 8, bottom: 8, border: outerBorder }} />}

          <View style={{ flexDirection: "row", flexGrow: 1, padding: 18, paddingTop: config.security.hologramSeal ? 24 : 18, alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fs(8), color: config.accentColor, letterSpacing: 1.5 }}>{config.eyebrowText}</Text>
              <Text style={{ fontSize: fs(16), fontWeight: 700, color: config.inkColor, marginTop: sp(6) }}>{data.title}</Text>
              <Text style={{ fontSize: fs(8), color: "#5b6472", marginTop: sp(8) }}>{data.orgName}</Text>

              <View style={{ flexDirection: "row", gap: 24, marginTop: sp(14), flexWrap: "wrap" }}>
                {visibleFields.filter((f) => f.key !== "description").map((f) => {
                  const value = fieldValue(f.key, data);
                  if (!value) return null;
                  return (
                    <View key={f.key}>
                      <Text style={{ fontSize: fs(6), color: "#5b6472", letterSpacing: 0.5 }}>{f.label.toUpperCase()}</Text>
                      <Text style={{ fontSize: fs(8), fontWeight: 700, color: config.inkColor, marginTop: 2 }}>{value}</Text>
                    </View>
                  );
                })}
              </View>

              {config.security.barcode && data.barcodeDataUri && (
                <View style={{ marginTop: sp(12) }}>
                  <BarcodeImage dataUri={data.barcodeDataUri} width={140} />
                </View>
              )}
            </View>

            <View style={{ alignItems: "center", justifyContent: "center", borderLeft: `1pt dashed ${config.accentColor}`, paddingLeft: 16, marginLeft: 16, gap: 8 }}>
              {config.security.qrCode && <Image src={data.qrDataUri} style={{ width: 56, height: 56 }} />}
              {config.security.digitalSignatureSeal && <DigitalSignatureSeal accentColor={config.accentColor} inkColor={config.inkColor} />}
            </View>
          </View>
        </Page>
      </Document>
    );
  }

  // "bordered" — formal full-page documents
  return (
    <Document {...documentSecurity}>
      <Page size={[width, height]} style={styles.page}>
        {config.backgroundImageUrl && isPdfSafeImage(config.backgroundImageUrl) && (
          <Image src={config.backgroundImageUrl} style={{ position: "absolute", top: 0, left: 0, width, height, objectFit: "cover" }} />
        )}
        {config.showGuilloche && <GuillocheBackground seed={`${data.orgName}:${config.documentType}`} width={width} height={height} accentColor={config.accentColor} />}
        <SecurityStack config={config} data={data} width={width} height={height} />
        {config.security.hologramSeal && (
          <>
            <HologramStrip side="left" pageWidth={width} pageHeight={height} thickness={14} />
            <HologramStrip side="right" pageWidth={width} pageHeight={height} thickness={14} />
          </>
        )}

        {outerBorder && <View style={{ position: "absolute", top: 24, left: 24, right: 24, bottom: 24, border: outerBorder, borderRadius: radius }} />}
        {config.frameStyle === "double" || config.frameStyle === "ornate" ? (
          <View style={{ position: "absolute", top: 30, left: 30, right: 30, bottom: 30, border: `0.5pt solid ${config.accentColor}`, borderRadius: radius }} />
        ) : null}

        <View style={{ padding: 56, paddingHorizontal: config.security.hologramSeal ? 66 : 56, flexGrow: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: sp(24) }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {config.showLogo && safeLogo ? <Image src={safeLogo} style={{ width: 40, height: 40, objectFit: "contain" }} /> : null}
              <Text style={{ fontSize: fs(14), fontWeight: 700, color: config.inkColor }}>{data.orgName}</Text>
            </View>
            <Text style={{ fontSize: fs(8), color: config.accentColor, letterSpacing: 2 }}>{data.documentType.toUpperCase()}</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 24, marginTop: sp(16) }}>
            {config.showPhoto && <PhotoBox url={safePhoto} shape={config.photoShape} size={90} />}

            <View style={{ flex: 1, textAlign: config.showPhoto ? "left" : "center", alignItems: config.showPhoto ? "flex-start" : "center" }}>
              <Text style={{ fontSize: fs(9), color: "#5b6472", letterSpacing: 3, marginBottom: sp(10) }}>{config.eyebrowText}</Text>
              <Text style={{ fontSize: fs(26), fontWeight: 700, color: config.inkColor, marginBottom: sp(6) }}>{data.title}</Text>

              {visibleFields.some((f) => f.key === "recipientName") && data.recipientName && (
                <>
                  <Text style={{ fontSize: fs(13), color: "#5b6472", marginTop: sp(14) }}>Issued to</Text>
                  <Text style={{ fontSize: fs(20), fontWeight: 700, color: config.inkColor, marginTop: sp(6) }}>{data.recipientName}</Text>
                </>
              )}

              {visibleFields.some((f) => f.key === "description") && data.description && (
                <Text style={{ fontSize: fs(10.5), color: "#5b6472", lineHeight: 1.6, marginTop: sp(20) }}>{data.description}</Text>
              )}
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 40, marginTop: sp(36) }}>
            {visibleFields.filter((f) => ["documentNumber", "issueDate", "expiryDate"].includes(f.key)).map((f) => {
              const value = fieldValue(f.key, data);
              if (!value) return null;
              return (
                <View key={f.key} style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: fs(7), color: "#5b6472", letterSpacing: 1.5, marginBottom: 4 }}>{f.label.toUpperCase()}</Text>
                  <Text style={{ fontSize: fs(10), color: config.inkColor, fontWeight: 700 }}>{value}</Text>
                </View>
              );
            })}
          </View>

          {config.security.barcode && data.barcodeDataUri && (
            <View style={{ alignItems: "center", marginTop: sp(20) }}>
              <BarcodeImage dataUri={data.barcodeDataUri} width={180} />
            </View>
          )}
        </View>

        <View style={{ position: "absolute", bottom: 56, left: config.security.hologramSeal ? 66 : 56, right: config.security.hologramSeal ? 66 : 56, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {config.security.qrCode && <Image src={data.qrDataUri} style={{ width: 64, height: 64 }} />}
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontSize: fs(7), color: "#5b6472", letterSpacing: 1 }}>VERIFICATION CODE</Text>
              <Text style={{ fontSize: fs(9), color: config.inkColor, fontFamily: "Courier", marginTop: 2 }}>{data.verificationCode}</Text>
            </View>
          </View>
          {config.security.digitalSignatureSeal && <DigitalSignatureSeal accentColor={config.accentColor} inkColor={config.inkColor} />}
        </View>
      </Page>
    </Document>
  );
}
