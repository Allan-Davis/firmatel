/**
 * lib/pdf/DocumentPdf.tsx
 *
 * REPLACES your current lib/pdf/DocumentPdf.tsx. Fixes two bugs from
 * the first version:
 *   1. Guilloche background wasn't rendering — <Svg> needs explicit
 *      numeric width/height (points), not percentage strings.
 *   2. The "◆" character rendered as garbage ("Æ") because the
 *      default PDF font has no glyph for it — replaced with a small
 *      colored square drawn as a View instead of relying on any font.
 */

import React from "react";
import { Document, Page, View, Text, Svg, Polygon, Image, StyleSheet } from "@react-pdf/renderer";
import { generateGuillochePoints } from "../security/guilloche";

export interface DocumentPdfProps {
  orgName: string;
  orgLogoUrl?: string | null;
  documentType: string;
  title: string;
  description?: string | null;
  documentNumber: string;
  recipientName?: string | null;
  issueDate: string;
  expiryDate?: string | null;
  verificationCode: string;
  qrDataUri: string;
  isSigned: boolean;
}

const INK = "#10151c";
const BRASS = "#c9a34e";
const PAPER = "#faf9f5";
const TEXT_SECONDARY = "#5b6472";
const SIGNED_GREEN = "#1f8f6e";
const UNSIGNED_AMBER = "#b98a3a";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const styles = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    padding: 0,
    fontFamily: "Helvetica",
  },
  frame: {
    position: "absolute",
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    border: `1.5pt solid ${BRASS}`,
  },
  frameInner: {
    position: "absolute",
    top: 30,
    left: 30,
    right: 30,
    bottom: 30,
    border: `0.5pt solid ${BRASS}`,
  },
  content: {
    padding: 56,
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  logo: { width: 40, height: 40, objectFit: "contain" },
  orgName: { fontSize: 14, fontWeight: 700, color: INK },
  orgTag: { fontSize: 8, color: TEXT_SECONDARY, letterSpacing: 1, marginTop: 2 },
  docTypeBadge: {
    fontSize: 8,
    color: BRASS,
    letterSpacing: 2,
    textAlign: "right",
  },
  titleBlock: { marginTop: 40, marginBottom: 28, textAlign: "center" },
  eyebrow: { fontSize: 9, color: TEXT_SECONDARY, letterSpacing: 3, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: 700, color: INK, marginBottom: 6 },
  recipientLine: { fontSize: 13, color: TEXT_SECONDARY, marginTop: 14 },
  recipientName: { fontSize: 20, fontWeight: 700, color: INK, marginTop: 6 },
  description: {
    fontSize: 10.5,
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 1.6,
    marginTop: 20,
    marginHorizontal: 40,
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    marginTop: 36,
  },
  metaItem: { alignItems: "center" },
  metaLabel: { fontSize: 7, color: TEXT_SECONDARY, letterSpacing: 1.5, marginBottom: 4 },
  metaValue: { fontSize: 10, color: INK, fontWeight: 700 },
  footer: {
    position: "absolute",
    bottom: 56,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  qr: { width: 64, height: 64 },
  verifyBlock: { marginLeft: 12 },
  verifyLabel: { fontSize: 7, color: TEXT_SECONDARY, letterSpacing: 1 },
  verifyCode: { fontSize: 9, color: INK, fontFamily: "Courier", marginTop: 2 },
  signedRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  signedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SIGNED_GREEN },
  unsignedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: UNSIGNED_AMBER },
  signedText: { fontSize: 8, color: SIGNED_GREEN, fontWeight: 700, letterSpacing: 0.5 },
  unsignedText: { fontSize: 8, color: UNSIGNED_AMBER, fontWeight: 700, letterSpacing: 0.5 },
});

function GuillocheBackground({ seed }: { seed: string }) {
  const polygons = generateGuillochePoints({
    seed,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    lineCount: 16,
  });

  return (
    <Svg
      width={PAGE_WIDTH}
      height={PAGE_HEIGHT}
      viewBox={`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      {polygons.map((points, i) => (
        <Polygon key={i} points={points} fill="none" stroke={BRASS} strokeWidth={0.7} opacity={0.4} />
      ))}
    </Svg>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export function DocumentPdf(props: DocumentPdfProps) {
  const {
    orgName,
    orgLogoUrl,
    documentType,
    title,
    description,
    documentNumber,
    recipientName,
    issueDate,
    expiryDate,
    verificationCode,
    qrDataUri,
    isSigned,
  } = props;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <GuillocheBackground seed={`${orgName}:${documentType}`} />
        <View style={styles.frame} />
        <View style={styles.frameInner} />

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {orgLogoUrl ? <Image src={orgLogoUrl} style={styles.logo} /> : null}
              <View>
                <Text style={styles.orgName}>{orgName}</Text>
                <Text style={styles.orgTag}>SECURE DOCUMENT INFRASTRUCTURE</Text>
              </View>
            </View>
            <Text style={styles.docTypeBadge}>{documentType.toUpperCase()}</Text>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>THIS DOCUMENT CERTIFIES</Text>
            <Text style={styles.title}>{title}</Text>

            {recipientName ? (
              <>
                <Text style={styles.recipientLine}>Issued to</Text>
                <Text style={styles.recipientName}>{recipientName}</Text>
              </>
            ) : null}

            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>DOCUMENT NO.</Text>
              <Text style={styles.metaValue}>{documentNumber}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>ISSUE DATE</Text>
              <Text style={styles.metaValue}>{formatDate(issueDate)}</Text>
            </View>
            {expiryDate ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>EXPIRES</Text>
                <Text style={styles.metaValue}>{formatDate(expiryDate)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image src={qrDataUri} style={styles.qr} />
            <View style={styles.verifyBlock}>
              <Text style={styles.verifyLabel}>VERIFICATION CODE</Text>
              <Text style={styles.verifyCode}>{verificationCode}</Text>
              <View style={styles.signedRow}>
                <View style={isSigned ? styles.signedDot : styles.unsignedDot} />
                <Text style={isSigned ? styles.signedText : styles.unsignedText}>
                  {isSigned ? "CRYPTOGRAPHICALLY SIGNED" : "UNSIGNED RECORD"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}