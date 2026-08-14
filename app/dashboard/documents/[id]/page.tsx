"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type DocumentData = {
  id: string;
  documentNumber: string;
  documentType: string;
  title: string;
  description: string | null;
  issueDate: string;
  expiryDate: string | null;
  status: string;
  verificationCode: string;
  qrPayload: string | null;
  recipient: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
  } | null;
};

export default function DocumentDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params.id);

  const [document, setDocument] =
    useState<DocumentData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadDocument() {
      try {
        const response = await fetch(
          `/api/documents/${id}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(
            data.message || "Unable to load document."
          );
          return;
        }

        setDocument(data.document);
      } catch {
        setError("Unable to connect to Firmatel.");
      } finally {
        setLoading(false);
      }
    }

    loadDocument();
  }, [id]);

  async function updateStatus(status: string) {
    if (!document) return;

    const confirmed = window.confirm(
      status === "REVOKED"
        ? "Are you sure you want to revoke this document?"
        : `Change document status to ${status}?`
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/documents/${document.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || "Unable to update document."
        );
        return;
      }

      setDocument(data.document);
    } catch {
      setError("Unable to connect to Firmatel.");
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteDocument() {
    if (!document) return;

    const confirmed = window.confirm(
      "This will permanently delete the document. Continue?"
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/documents/${document.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || "Unable to delete document."
        );
        return;
      }

      router.push("/dashboard/documents");
      router.refresh();
    } catch {
      setError("Unable to connect to Firmatel.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-500">
            Loading document...
          </p>
        </div>
      </main>
    );
  }

  if (error && !document) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/dashboard/documents"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Documents
          </Link>

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div>
          <Link
            href="/dashboard"
            className="font-bold text-slate-900"
          >
            Firmatel
          </Link>

          <p className="text-xs text-slate-500">
            Secure document infrastructure
          </p>
        </div>

        <Link
          href="/dashboard/documents"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Documents
        </Link>
      </header>

      <section className="mx-auto max-w-6xl p-6 lg:p-10">
        <div className="mb-8">
          <Link
            href="/dashboard/documents"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Documents
          </Link>

          <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-medium text-blue-600">
                {document.documentType}
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                {document.title}
              </h1>

              <p className="mt-2 font-mono text-sm text-slate-500">
                {document.documentNumber}
              </p>
            </div>

            <StatusBadge status={document.status} />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="font-semibold text-slate-900">
                  Document Information
                </h2>
              </div>

              <div className="grid gap-6 p-6 sm:grid-cols-2">
                <Detail
                  label="Document Number"
                  value={document.documentNumber}
                />

                <Detail
                  label="Document Type"
                  value={document.documentType}
                />

                <Detail
                  label="Issue Date"
                  value={new Date(
                    document.issueDate
                  ).toLocaleDateString("en-GB")}
                />

                <Detail
                  label="Expiry Date"
                  value={
                    document.expiryDate
                      ? new Date(
                          document.expiryDate
                        ).toLocaleDateString("en-GB")
                      : "No expiry"
                  }
                />

                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Description
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {document.description ||
                      "No description provided."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="font-semibold text-slate-900">
                  Recipient
                </h2>
              </div>

              <div className="p-6">
                {document.recipient ? (
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Detail
                      label="Full Name"
                      value={document.recipient.fullName}
                    />

                    <Detail
                      label="Email"
                      value={
                        document.recipient.email || "—"
                      }
                    />

                    <Detail
                      label="Phone"
                      value={
                        document.recipient.phone || "—"
                      }
                    />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No recipient has been assigned.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="font-semibold text-slate-900">
                  Verification
                </h2>
              </div>

              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Verification Code
                </p>

                <div className="mt-2 rounded-lg bg-slate-50 p-4">
                  <p className="break-all font-mono text-sm font-semibold text-slate-900">
                    {document.verificationCode}
                  </p>
                </div>

                <p className="mt-4 text-sm text-slate-500">
                  This unique code can be used to verify the
                  authenticity and current status of the
                  document.
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                Document Actions
              </h2>
              <a
                href={`/api/documents/${document.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
              >
                Download PDF
              </a>			  
			  

              <div className="mt-5 space-y-3">
                {document.status !== "REVOKED" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      updateStatus("REVOKED")
                    }
                    className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Revoke Document
                  </button>
                )}

                {document.status === "DRAFT" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      updateStatus("ISSUED")
                    }
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Issue Document
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={deleteDocument}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Delete Document
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                Security
              </h2>

              <div className="mt-5 space-y-4">
                <SecurityItem
                  label="Verification"
                  value="Enabled"
                />

                <SecurityItem
                  label="Unique Code"
                  value="Generated"
                />

                <SecurityItem
                  label="Organization"
                  value="Isolated"
                />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

function SecurityItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-medium text-green-600">
        {value}
      </span>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    ISSUED: "bg-green-50 text-green-700",
    DRAFT: "bg-slate-100 text-slate-700",
    REVOKED: "bg-red-50 text-red-700",
    EXPIRED: "bg-orange-50 text-orange-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}