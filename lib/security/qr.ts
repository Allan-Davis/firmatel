/**
 * lib/security/qr.ts
 *
 * New file. Generates a QR code (as a data URI) encoding the live
 * verification URL for a document — not a photo of the document
 * itself, just a link. Scanning it always hits your real, current
 * database record, so a photocopy can't "freeze" an old valid state.
 *
 * Requires: npm install qrcode
 *           npm install -D @types/qrcode
 */

import QRCode from "qrcode";

export async function generateVerificationQr(verificationCode: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify/${verificationCode}`;

  return QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 300,
    color: {
      dark: "#10151c", // ink-900, matches the design system
      light: "#ffffff",
    },
  });
}
