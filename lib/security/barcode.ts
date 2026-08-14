/**
 * lib/security/barcode.ts
 *
 * New file. Generates a real, scannable Code128 barcode as a PNG
 * data URI — same "always re-verifiable" philosophy as the QR code,
 * just in the format a lot of enterprise/government document
 * scanners still expect alongside a QR.
 *
 * Requires: npm install bwip-js
 */

import bwipjs from "bwip-js";

export async function generateBarcode(text: string): Promise<string> {
  const png = await bwipjs.toBuffer({
    bcid: "code128",
    text,
    scale: 3,
    height: 10,
    includetext: false,
    backgroundcolor: "FFFFFF",
  });
  return `data:image/png;base64,${png.toString("base64")}`;
}
