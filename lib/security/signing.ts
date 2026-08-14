/**
 * lib/security/signing.ts
 *
 * Cryptographic core of Firmatel's authenticity model.
 * This is a brand-new file — create it at exactly this path.
 * Server-only: never import this from a "use client" component.
 */

import crypto from "crypto";

const ENC_ALGO = "aes-256-gcm";

function getMasterKey(): Buffer {
  const key = process.env.FIRMATEL_MASTER_KEY;
  if (!key) {
    throw new Error(
      "FIRMATEL_MASTER_KEY is not set. Generate one and add it to .env"
    );
  }
  return Buffer.from(key, "base64");
}

export function generateOrganizationKeypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

  const publicKeyB64 = publicKey
    .export({ type: "spki", format: "der" })
    .toString("base64");

  const privateKeyRaw = privateKey
    .export({ type: "pkcs8", format: "der" })
    .toString("base64");

  const privateKeyEnc = encryptPrivateKey(privateKeyRaw);

  return { publicKey: publicKeyB64, privateKeyEnc };
}

function encryptPrivateKey(rawBase64: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENC_ALGO, getMasterKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(rawBase64, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((b) => b.toString("base64")).join(".");
}

function decryptPrivateKey(enc: string): string {
  const [ivB64, tagB64, dataB64] = enc.split(".");
  const decipher = crypto.createDecipheriv(
    ENC_ALGO,
    getMasterKey(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export interface SignablePayload {
  organizationId: string;
  documentNumber: string;
  documentType: string;
  title: string;
  recipientName?: string | null;
  issueDate: string;
  status: string;
}

export function canonicalize(payload: SignablePayload): string {
  const ordered = Object.keys(payload)
    .sort()
    .reduce((acc, key) => {
      acc[key] = (payload as any)[key] ?? "";
      return acc;
    }, {} as Record<string, unknown>);
  return JSON.stringify(ordered);
}

export function hashPayload(payload: SignablePayload): string {
  return crypto.createHash("sha256").update(canonicalize(payload)).digest("hex");
}

export function signHash(hashHex: string, privateKeyEnc: string): string {
  const rawBase64 = decryptPrivateKey(privateKeyEnc);
  const privateKey = crypto.createPrivateKey({
    key: Buffer.from(rawBase64, "base64"),
    format: "der",
    type: "pkcs8",
  });
  const signature = crypto.sign(null, Buffer.from(hashHex, "hex"), privateKey);
  return signature.toString("base64");
}

export function verifySignature(
  hashHex: string,
  signatureB64: string,
  publicKeyB64: string
): boolean {
  const publicKey = crypto.createPublicKey({
    key: Buffer.from(publicKeyB64, "base64"),
    format: "der",
    type: "spki",
  });
  return crypto.verify(
    null,
    Buffer.from(hashHex, "hex"),
    publicKey,
    Buffer.from(signatureB64, "base64")
  );
}

export function issueSignature(
  payload: SignablePayload,
  orgPrivateKeyEnc: string
) {
  const contentHash = hashPayload(payload);
  const signature = signHash(contentHash, orgPrivateKeyEnc);
  return { contentHash, signature, signedAt: new Date() };
}

export type VerificationResult =
  | { status: "VALID" }
  | { status: "TAMPERED"; reason: string }
  | { status: "UNSIGNED" };

export function verifyDocumentIntegrity(
  currentPayload: SignablePayload,
  storedContentHash: string | null,
  storedSignature: string | null,
  orgPublicKey: string
): VerificationResult {
  if (!storedContentHash || !storedSignature) {
    return { status: "UNSIGNED" };
  }

  const recomputedHash = hashPayload(currentPayload);
  if (recomputedHash !== storedContentHash) {
    return {
      status: "TAMPERED",
      reason: "Stored record no longer matches the hash it was signed with.",
    };
  }

  const sigValid = verifySignature(storedContentHash, storedSignature, orgPublicKey);
  if (!sigValid) {
    return {
      status: "TAMPERED",
      reason: "Signature does not match the organization's public key.",
    };
  }

  return { status: "VALID" };
}
