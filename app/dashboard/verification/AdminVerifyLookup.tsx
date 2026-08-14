"use client";

import { FormEvent, useState } from "react";

// app/dashboard/verification/AdminVerifyLookup.tsx
//
// New file. Lets an admin check any document's authenticity from
// inside the dashboard, without needing the public /verify/<code>
// link. Reuses your existing /api/verification/[code] route — same
// check the public page runs, same signature verification, nothing
// duplicated.

interface VerifyResult {
  status: "VALID" | "REVOKED" | "INVALID" | "TAMPERED" | "EXPIRED";
  documentType?: string;
  title?: string;
  organizationName?: string;
  recipientName?: string;
  issueDate?: string;
  documentNumber?: string;
  reason?: string;
}

const STATUS_STYLES: Record<string, string> = {
  VALID: "bg-green-50 text-green-700 border-green-200",
  REVOKED: "bg-red-50 text-red-700 border-red-200",
  TAMPERED: "bg-red-50 text-red-700 border-red-200",
  EXPIRED: "bg-orange-50 text-orange-700 border-orange-200",
  INVALID: "bg-slate-50 text-slate-700 border-slate-200",
};

export function AdminVerifyLookup() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/verification/${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Could not reach the verification service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-slate-900">Verify a Document</h2>
      <p className="mt-1 text-sm text-slate-500">
        Paste any document's verification code to check its status instantly — the same cryptographic check the
        public verification page runs.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste verification code..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Verify"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className={`mt-4 rounded-lg border p-4 ${STATUS_STYLES[result.status] || STATUS_STYLES.INVALID}`}>
          <p className="font-semibold">{result.status}</p>
          {result.title && <p className="mt-1 text-sm">{result.title}</p>}
          {result.recipientName && <p className="text-sm">Issued to: {result.recipientName}</p>}
          {result.documentNumber && <p className="text-sm">Document No: {result.documentNumber}</p>}
          {result.issueDate && <p className="text-sm">Issued: {result.issueDate}</p>}
          {result.reason && <p className="mt-1 text-sm">{result.reason}</p>}
        </div>
      )}
    </div>
  );
}
