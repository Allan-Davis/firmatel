import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createDocumentAction } from "../actions";

// app/dashboard/documents/new/page.tsx
//
// FIX: removed the manual encType="multipart/form-data" attribute.
// Next.js automatically sets the correct encoding for a Server
// Action form once it detects a <input type="file"> inside it —
// specifying it yourself conflicts with that and React overrides it
// anyway, but logs a console error in the meantime. Everything else
// in this file is identical to what you already have.

const DOCUMENT_TYPES = [
  "CERTIFICATE",
  "ID",
  "EVENT",
  "LETTER",
  "BADGE",
  "PASS",
  "RECEIPT",
  "ACCESS",
  "ADMISSION",
  "PERMIT",
  "LICENCE",
  "OTHER",
];

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { type } = await searchParams;

  const preselected =
    type && DOCUMENT_TYPES.includes(type)
      ? type
      : DOCUMENT_TYPES[0];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <Link href="/dashboard" className="font-bold text-slate-900">
          Firmatel
        </Link>

        <Link
          href="/dashboard/documents"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Documents
        </Link>
      </header>

      <section className="mx-auto max-w-2xl p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Create Document
        </h1>

        <p className="mt-1 text-slate-500">
          Issue a new secure, cryptographically signed document.
        </p>

        <form
          action={createDocumentAction}
          className="mt-8 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="documentType"
              className="block text-sm font-medium text-slate-700"
            >
              Document Type <span className="text-red-500">*</span>
            </label>

            <select
              id="documentType"
              name="documentType"
              defaultValue={preselected}
              required
              className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <Field
            label="Title"
            name="title"
            placeholder="e.g. Certificate of Completion"
            required
          />

          <TextArea
            label="Description"
            name="description"
            placeholder="Optional details about this document"
          />

          <Field
            label="Recipient Name"
            name="recipientName"
            placeholder="Optional — who this document is issued to"
          />

          <Field
            label="Recipient Email"
            name="recipientEmail"
            type="email"
            placeholder="Optional"
          />

          <div>
            <label
              htmlFor="recipientPhoto"
              className="block text-sm font-medium text-slate-700"
            >
              Recipient Photo{" "}
              <span className="text-slate-400">
                (optional — for IDs, Badges, Passes)
              </span>
            </label>

            <input
              id="recipientPhoto"
              name="recipientPhoto"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-1.5 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <Field
            label="Expiry Date"
            name="expiryDate"
            type="date"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Issue Document
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        rows={3}
        className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}