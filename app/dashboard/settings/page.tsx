"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

// app/dashboard/settings/page.tsx
//
// REPLACES your current version. Only change: two links added inside
// the "Branding" section, pointing to the logo upload page and the
// document template editor. Everything else — every field, the save
// logic, the /api/organization calls — is exactly what you already
// have, untouched.

const organizationTypes = [
  "COMPANY",
  "SCHOOL",
  "UNIVERSITY",
  "COLLEGE",
  "TRAINING_INSTITUTION",
  "CHURCH",
  "HOSPITAL",
  "BANK",
  "SACCO",
  "NGO",
  "GOVERNMENT",
  "EVENT_ORGANIZER",
  "PROFESSIONAL_BODY",
  "ASSOCIATION",
  "OTHER",
];

export default function OrganizationSettingsPage() {
  const [form, setForm] = useState({
    name: "",
    type: "COMPANY",
    email: "",
    phone: "",
    website: "",
    address: "",
    logoUrl: "",
    primaryColor: "",
    secondaryColor: "",
    documentPrefix: "",
    verificationUrl: "",
    timezone: "Africa/Nairobi",
    dateFormat: "DD/MM/YYYY",
    defaultDocumentValidityDays: "",
    requireQrVerification: true,
    requireRecipientEmail: false,
    requireRecipientPhone: false,
    allowPublicVerification: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrganization() {
      try {
        const response = await fetch("/api/organization");

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.message || "Unable to load organization.");
          return;
        }

        const organization = data.organization;
        const settings = organization.settings;

        setForm({
          name: organization.name || "",
          type: organization.type || "COMPANY",
          email: organization.email || "",
          phone: organization.phone || "",
          website: organization.website || "",
          address: organization.address || "",
          logoUrl: organization.logoUrl || "",
          primaryColor: organization.primaryColor || "",
          secondaryColor: organization.secondaryColor || "",
          documentPrefix: organization.documentPrefix || "",
          verificationUrl: organization.verificationUrl || "",
          timezone: settings?.timezone || "Africa/Nairobi",
          dateFormat: settings?.dateFormat || "DD/MM/YYYY",
          defaultDocumentValidityDays:
            settings?.defaultDocumentValidityDays?.toString() || "",
          requireQrVerification:
            settings?.requireQrVerification ?? true,
          requireRecipientEmail:
            settings?.requireRecipientEmail ?? false,
          requireRecipientPhone:
            settings?.requireRecipientPhone ?? false,
          allowPublicVerification:
            settings?.allowPublicVerification ?? true,
        });
      } catch {
        setError("Unable to connect to Firmatel.");
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, []);

  function updateField(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/organization", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to save changes.");
        return;
      }

      setMessage("Organization settings saved successfully.");
    } catch {
      setError("Unable to connect to Firmatel.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <p className="text-slate-500">Loading organization settings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <h1 className="text-xl font-bold text-slate-900">
          Organization Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Configure your Firmatel organization and verification settings.
        </p>
      </header>

      <section className="mx-auto max-w-5xl p-6 lg:p-8">
        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <Section title="Organization Profile">
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Organization Name"
                value={form.name}
                onChange={(value) => updateField("name", value)}
                required
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Organization Type
                </label>

                <select
                  value={form.type}
                  onChange={(event) =>
                    updateField("type", event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
                >
                  {organizationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) => updateField("email", value)}
              />

              <Field
                label="Phone"
                value={form.phone}
                onChange={(value) => updateField("phone", value)}
              />

              <Field
                label="Website"
                value={form.website}
                onChange={(value) => updateField("website", value)}
              />

              <Field
                label="Logo URL"
                value={form.logoUrl}
                onChange={(value) => updateField("logoUrl", value)}
              />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Address
                </label>

                <textarea
                  value={form.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </Section>

          <Section title="Branding">
            <div className="mb-6 flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Prefer to upload a logo file instead of pasting a URL?
                </p>
                <p className="mt-0.5 text-xs text-blue-700">
                  Uses the same "Logo URL" field above — either method works, and the last one saved wins.
                </p>
              </div>
              <Link
                href="/dashboard/settings/branding"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Upload Logo File
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Primary Color"
                placeholder="#2563EB"
                value={form.primaryColor}
                onChange={(value) => updateField("primaryColor", value)}
              />

              <Field
                label="Secondary Color"
                placeholder="#0F172A"
                value={form.secondaryColor}
                onChange={(value) =>
                  updateField("secondaryColor", value)
                }
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Document Templates
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Customize fonts, colors, shapes, and security features for each document type.
                </p>
              </div>
              <Link
                href="/dashboard/settings/templates"
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
              >
                Customize Templates
              </Link>
            </div>
          </Section>

          <Section title="Document & Verification">
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Document Prefix"
                placeholder="ORG"
                value={form.documentPrefix}
                onChange={(value) =>
                  updateField("documentPrefix", value.toUpperCase())
                }
              />

              <Field
                label="Verification URL"
                value={form.verificationUrl}
                onChange={(value) =>
                  updateField("verificationUrl", value)
                }
              />

              <Field
                label="Default Document Validity (Days)"
                type="number"
                value={form.defaultDocumentValidityDays}
                onChange={(value) =>
                  updateField("defaultDocumentValidityDays", value)
                }
              />
            </div>

            <div className="mt-6 space-y-4">
              <Toggle
                label="Require QR Verification"
                checked={form.requireQrVerification}
                onChange={(value) =>
                  updateField("requireQrVerification", value)
                }
              />

              <Toggle
                label="Allow Public Verification"
                checked={form.allowPublicVerification}
                onChange={(value) =>
                  updateField("allowPublicVerification", value)
                }
              />

              <Toggle
                label="Require Recipient Email"
                checked={form.requireRecipientEmail}
                onChange={(value) =>
                  updateField("requireRecipientEmail", value)
                }
              />

              <Toggle
                label="Require Recipient Phone"
                checked={form.requireRecipientPhone}
                onChange={(value) =>
                  updateField("requireRecipientPhone", value)
                }
              />
            </div>
          </Section>

          <Section title="Regional Settings">
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Timezone"
                value={form.timezone}
                onChange={(value) => updateField("timezone", value)}
              />

              <Field
                label="Date Format"
                value={form.dateFormat}
                onChange={(value) => updateField("dateFormat", value)}
              />
            </div>
          </Section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-6 text-lg font-semibold text-slate-900">
        {title}
      </h2>

      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-4">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-slate-300 text-blue-600"
      />
    </label>
  );
}