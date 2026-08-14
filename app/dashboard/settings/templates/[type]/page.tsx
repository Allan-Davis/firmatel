import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/dashboard/Shell";
import { getBaseTemplate, resolveTemplate } from "@/lib/pdf/templateDefaults";
import { FIELD_KEYS, DEFAULT_FIELD_LABELS, TemplateConfig } from "@/lib/pdf/templateTypes";
import { saveTemplateAction } from "../actions";
import { FONT_CATALOG } from "@/lib/pdf/fonts";

// REPLACES your current app/dashboard/settings/templates/[type]/page.tsx.
// Adds: font family (incl. custom font URL), font scale, corner
// style, frame style, background image URL, photo section toggle +
// shape, and the full security feature checklist.

export default async function TemplateEditorPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const documentType = type.toUpperCase();

  const base = getBaseTemplate(documentType);
  if (!base) notFound();

  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organization: true },
  });
  if (!user || user.organizationId !== session.organizationId) redirect("/login");

  const saved = await prisma.documentTemplate.findFirst({
    where: { organizationId: session.organizationId, documentType, isActive: true },
  });

  const config: TemplateConfig = resolveTemplate(
    documentType,
    user.organization.primaryColor,
    (saved?.layout as Partial<TemplateConfig>) ?? null
  );

  return (
    <Shell activeHref="/dashboard/settings/templates" userName={user.name} userRole={user.role} orgName={user.organization.name}>
      <div className="mb-8 mt-1">
        <Link href="/dashboard/settings/templates" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          ← All Templates
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          {documentType.charAt(0) + documentType.slice(1).toLowerCase()} Template
        </h1>
        <p className="mt-2 text-slate-500">
          Every toggle below is optional — nothing is forced on. Changes apply to every future{" "}
          {documentType.toLowerCase()} PDF automatically.
        </p>
      </div>

      <form action={saveTemplateAction} className="grid gap-6 lg:grid-cols-2">
        <input type="hidden" name="documentType" value={documentType} />

        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Layout</h2>
          <SelectField label="Page Size" name="pageSize" defaultValue={config.pageSize} options={["A4", "A5", "LETTER", "CARD", "TICKET", "RECEIPT"]} />
          <SelectField label="Orientation" name="orientation" defaultValue={config.orientation} options={["portrait", "landscape"]} />
          <SelectField label="Shape" name="shape" defaultValue={config.shape} options={["bordered", "card", "ticket"]} />
          <SelectField label="Corners" name="cornerStyle" defaultValue={config.cornerStyle} options={["square", "rounded"]} />
          <SelectField label="Frame Style" name="frameStyle" defaultValue={config.frameStyle} options={["none", "single", "double", "ornate"]} />
          <SelectField
            label="Content Density (fit to page)"
            name="contentDensity"
            defaultValue={config.contentDensity}
            options={["compact", "normal", "spacious"]}
          />
          <TextField label="Eyebrow Text" name="eyebrowText" defaultValue={config.eyebrowText} />
        </div>

        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Typography</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700">Font</label>
            <select
              name="fontFamily"
              defaultValue={config.fontFamily}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {Object.entries(
                FONT_CATALOG.reduce<Record<string, typeof FONT_CATALOG>>((groups, font) => {
                  (groups[font.category] ||= []).push(font);
                  return groups;
                }, {})
              ).map(([category, fonts]) => (
                <optgroup key={category} label={category}>
                  {fonts.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="custom">Custom (paste a font URL below)</option>
            </select>
            <p className="mt-1 text-xs text-slate-400">
              30 built-in fonts across Serif, Calligraphy, Old-World/Blackletter, Monospace, and Classic styles.
              Each is checked for availability when a document is generated — if one becomes unreachable, it
              falls back to Helvetica automatically rather than breaking the PDF.
            </p>
          </div>
          <TextField label="Custom Font Name (only if Font = Custom)" name="customFontName" defaultValue={config.customFontName} />
          <TextField label="Custom Font URL — direct .ttf link (only if Font = Custom)" name="customFontUrl" defaultValue={config.customFontUrl} />
          <div>
            <label className="block text-sm font-medium text-slate-700">Font Size Scale ({config.fontScale}×)</label>
            <input
              type="range"
              name="fontScale"
              min="0.7"
              max="1.6"
              step="0.05"
              defaultValue={config.fontScale}
              className="mt-2 block w-full"
            />
          </div>
        </div>

        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Colors & Background</h2>
          <ColorField label="Ink Color (text)" name="inkColor" defaultValue={config.inkColor} />
          <ColorField label="Accent Color (border, badges)" name="accentColor" defaultValue={config.accentColor} />
          <ColorField label="Background Color" name="backgroundColor" defaultValue={config.backgroundColor} />
          <TextField label="Background Image URL (optional, replaces plain color)" name="backgroundImageUrl" defaultValue={config.backgroundImageUrl ?? ""} />
          <CheckboxField label="Show organization logo" name="showLogo" defaultChecked={config.showLogo} />
          <CheckboxField label="Show security background pattern (guilloche)" name="showGuilloche" defaultChecked={config.showGuilloche} />
        </div>

        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Passport Photo</h2>
          <CheckboxField label="Show recipient photo section" name="showPhoto" defaultChecked={config.showPhoto} />
          <SelectField label="Photo Shape" name="photoShape" defaultValue={config.photoShape} options={["rectangle", "circle"]} />
          <p className="text-xs text-slate-400">
            Photos are uploaded per-recipient when creating a document (or added later — ask if you want a
            dedicated recipient photo manager built next).
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Security Features</h2>
          <p className="text-sm text-slate-500">
            Choose exactly which security elements appear on this document type. Nothing here is generic —
            pick what fits.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CheckboxField label="QR Code" name="security_qrCode" defaultChecked={config.security.qrCode} />
            <CheckboxField label="Barcode" name="security_barcode" defaultChecked={config.security.barcode} />
            <CheckboxField label="Digital Signature Seal" name="security_digitalSignatureSeal" defaultChecked={config.security.digitalSignatureSeal} />
            <CheckboxField label="Hologram Seal" name="security_hologramSeal" defaultChecked={config.security.hologramSeal} />
            <CheckboxField label="Watermark" name="security_watermark" defaultChecked={config.security.watermark} />
            <CheckboxField label="Microprinting" name="security_microprint" defaultChecked={config.security.microprint} />
            <CheckboxField label="Security Threads" name="security_securityThreads" defaultChecked={config.security.securityThreads} />
            <CheckboxField label="Special Ink Band" name="security_specialInk" defaultChecked={config.security.specialInk} />
          </div>

          <div className="grid gap-4 pt-2 sm:grid-cols-3">
            <TextField label="Watermark Text" name="watermarkText" defaultValue={config.security.watermarkText} />
            <TextField label="Microprint Text" name="microprintText" defaultValue={config.security.microprintText} />
            <div>
              <label className="block text-sm font-medium text-slate-700">Security Thread Count</label>
              <input
                type="number"
                name="threadCount"
                min="1"
                max="6"
                defaultValue={config.security.threadCount}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Fields to Display</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {FIELD_KEYS.map((key) => {
              const current = config.fields.find((f) => f.key === key);
              return <CheckboxField key={key} label={DEFAULT_FIELD_LABELS[key]} name={`field_${key}`} defaultChecked={current?.show ?? true} />;
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            Save Template
          </button>
        </div>
      </form>
    </Shell>
  );
}

function TextField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input name={name} defaultValue={defaultValue} className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </div>
  );
}

function ColorField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="mt-1.5 flex items-center gap-3">
        <input type="color" name={name} defaultValue={defaultValue} className="h-10 w-14 rounded border border-slate-300" />
        <span className="font-mono text-xs text-slate-500">{defaultValue}</span>
      </div>
    </div>
  );
}

function SelectField({ label, name, defaultValue, options }: { label: string; name: string; defaultValue: string; options: string[] }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <select name={name} defaultValue={defaultValue} className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({ label, name, defaultChecked }: { label: string; name: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-slate-300" />
      {label}
    </label>
  );
}
