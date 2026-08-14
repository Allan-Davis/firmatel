/**
 * lib/security/audit-chain.ts
 * New file — create at exactly this path.
 */

import crypto from "crypto";

export interface AuditEntryInput {
  organizationId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  createdAt: Date;
}

export function computeEntryHash(
  entry: AuditEntryInput,
  previousHash: string | null
): string {
  const material = JSON.stringify({
    organizationId: entry.organizationId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    description: entry.description,
    createdAt: entry.createdAt.toISOString(),
    previousHash: previousHash ?? "GENESIS",
  });
  return crypto.createHash("sha256").update(material).digest("hex");
}

export function buildChainedEntry(
  entry: AuditEntryInput,
  previousHash: string | null
) {
  const entryHash = computeEntryHash(entry, previousHash);
  return { previousHash, entryHash };
}

export interface ChainCheckRow extends AuditEntryInput {
  previousHash: string | null;
  entryHash: string | null;
}

export interface ChainVerificationResult {
  ok: boolean;
  brokenAt: number | null;
  totalEntries: number;
}

export function verifyChain(rows: ChainCheckRow[]): ChainVerificationResult {
  let previousHash: string | null = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.entryHash) continue;

    const expected = computeEntryHash(row, previousHash);
    if (expected !== row.entryHash) {
      return { ok: false, brokenAt: i, totalEntries: rows.length };
    }
    previousHash = row.entryHash;
  }

  return { ok: true, brokenAt: null, totalEntries: rows.length };
}
