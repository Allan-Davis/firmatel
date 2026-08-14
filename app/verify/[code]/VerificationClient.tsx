"use client";

import { useEffect, useState } from "react";
import { guillocheDataUri } from "@/lib/security/guilloche";

type VerifyStatus = "CHECKING" | "VALID" | "REVOKED" | "INVALID" | "TAMPERED" | "EXPIRED";

interface VerifyResponse {
  status: VerifyStatus;
  documentType?: string;
  title?: string;
  organizationName?: string;
  recipientName?: string;
  issueDate?: string;
  documentNumber?: string;
  reason?: string;
}

const STAMP_CONFIG: Record<
  VerifyStatus,
  { label: string; color: string; bg: string }
> = {
  CHECKING: { label: "Checking", color: "var(--text-secondary-on-dark)", bg: "transparent" },
  VALID: { label: "Verified", color: "var(--signal-valid)", bg: "var(--signal-valid-bg)" },
  REVOKED: { label: "Revoked", color: "var(--signal-revoked)", bg: "var(--signal-revoked-bg)" },
  INVALID: { label: "Not Found", color: "var(--signal-revoked)", bg: "var(--signal-revoked-bg)" },
  TAMPERED: { label: "Tampered", color: "var(--signal-revoked)", bg: "var(--signal-revoked-bg)" },
  EXPIRED: { label: "Expired", color: "var(--signal-pending)", bg: "var(--signal-pending-bg)" },
};

export function VerificationClient({ code }: { code: string }) {
  const [result, setResult] = useState<VerifyResponse>({ status: "CHECKING" });
  const [scanProgress, setScanProgress] = useState(0);

  const texture = guillocheDataUri({
    seed: `verify-${code}`,
    width: 900,
    height: 900,
    lineCount: 24,
    strokeWidth: 0.7,
    opacity: 0.35,
    strokeColor: "#c9a34e",
  });

  useEffect(() => {
    // Minimum perceived-check duration so VALID doesn't flash
    // instantly and feel unconvincing — this is a real API call,
    // just paced against a scan animation.
    const start = Date.now();
    const scanInterval = setInterval(() => {
      setScanProgress((p) => Math.min(p + 4, 96));
    }, 30);

    fetch(`/api/verify/${code}`)
      .then((r) => r.json())
      .then((data: VerifyResponse) => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(650 - elapsed, 0);
        setTimeout(() => {
          clearInterval(scanInterval);
          setScanProgress(100);
          setResult(data);
        }, remaining);
      })
      .catch(() => {
        clearInterval(scanInterval);
        setResult({ status: "INVALID", reason: "Could not reach verification service." });
      });

    return () => clearInterval(scanInterval);
  }, [code]);

  const stamp = STAMP_CONFIG[result.status];
  const isChecking = result.status === "CHECKING";

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
      style={{
        background: "var(--ink-950)",
        backgroundImage: `url("${texture}")`,
        backgroundSize: "900px 900px",
        backgroundPosition: "center",
      }}
    >
      <div className="mb-8 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center font-data text-xs"
          style={{
            border: "1px solid var(--brass-500)",
            color: "var(--brass-400)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          F
        </div>
        <span
          className="text-xs uppercase tracking-[0.2em]"
          style={{ color: "var(--text-secondary-on-dark)" }}
        >
          Firmatel Verification
        </span>
      </div>

      <div
        className="w-full max-w-md p-8 text-center"
        style={{
          background: "var(--paper-50)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 24px 60px -20px rgba(0,0,0,0.6)",
        }}
      >
        <div
          className="font-data text-xs uppercase tracking-widest"
          style={{ color: "var(--text-secondary-on-paper)" }}
        >
          Document No.
        </div>
        <div
          className="font-data mb-6 text-lg font-semibold"
          style={{ color: "var(--text-primary-on-paper)" }}
        >
          {code}
        </div>

        {/* Scan bar */}
        {isChecking && (
          <div
            className="mx-auto mb-6 h-1 w-full overflow-hidden"
            style={{ background: "var(--paper-200)", borderRadius: "999px" }}
          >
            <div
              className="h-full transition-all"
              style={{
                width: `${scanProgress}%`,
                background: "var(--brass-500)",
                transitionTimingFunction: "var(--ease-plate)",
              }}
            />
          </div>
        )}

        {/* Stamp verdict */}
        {!isChecking && (
          <div
            className="mx-auto mb-6 inline-flex items-center justify-center px-6 py-3"
            style={{
              border: `2px solid ${stamp.color}`,
              color: stamp.color,
              background: stamp.bg,
              borderRadius: "var(--radius-sm)",
              transform: "rotate(-2deg)",
              animation: "stamp-in 260ms var(--ease-plate)",
            }}
          >
            <span className="font-display text-2xl font-semibold uppercase tracking-wide">
              {stamp.label}
            </span>
          </div>
        )}

        {!isChecking && result.status === "VALID" && (
          <dl className="space-y-2 text-left">
            <Row label="Type" value={result.documentType} />
            <Row label="Title" value={result.title} />
            <Row label="Issued to" value={result.recipientName} />
            <Row label="Issuer" value={result.organizationName} />
            <Row label="Issue date" value={result.issueDate} />
          </dl>
        )}

        {!isChecking && result.status !== "VALID" && result.reason && (
          <p
            className="text-sm"
            style={{ color: "var(--text-secondary-on-paper)" }}
          >
            {result.reason}
          </p>
        )}
      </div>

      <p
        className="mt-6 max-w-sm text-center text-xs"
        style={{ color: "var(--text-secondary-on-dark)" }}
      >
        This result is generated live from Firmatel's signed record, not
        from the document image. A photocopy or edited PDF cannot produce
        a valid result on its own.
      </p>

      <style>{`
        @keyframes stamp-in {
          from { opacity: 0; transform: rotate(-2deg) scale(1.4); }
          to { opacity: 1; transform: rotate(-2deg) scale(1); }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between border-b py-1.5" style={{ borderColor: "var(--paper-200)" }}>
      <dt className="text-xs uppercase tracking-wide" style={{ color: "var(--text-secondary-on-paper)" }}>
        {label}
      </dt>
      <dd className="text-sm font-medium" style={{ color: "var(--text-primary-on-paper)" }}>
        {value}
      </dd>
    </div>
  );
}
