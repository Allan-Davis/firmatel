import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/dashboard/Shell";
import { DEFAULT_TEMPLATES } from "@/lib/pdf/templateDefaults";

// app/dashboard/settings/templates/page.tsx
//
// REPLACES your current version. Only change: a "← Settings" back
// link added at the top, so navigation works both directions between
// this page and your main Settings page.

export default async function TemplatesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organization: true },
  });
  if (!user || user.organizationId !== session.organizationId) redirect("/login");

  const customTemplates = await prisma.documentTemplate.findMany({
    where: { organizationId: session.organizationId, isActive: true },
  });
  const customizedTypes = new Set(customTemplates.map((t) => t.documentType));

  const types = Object.keys(DEFAULT_TEMPLATES).filter((t) => t !== "OTHER");

  return (
    <Shell
      activeHref="/dashboard/settings/templates"
      userName={user.name}
      userRole={user.role}
      orgName={user.organization.name}
    >
      <div className="mb-8 mt-1">
        <Link href="/dashboard/settings" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          ← Settings
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Document Templates</h1>
        <p className="mt-2 text-slate-500">
          Customize how each document type looks when printed — colors, fonts, size, shape, and which fields
          appear. Your brand color ({user.organization.primaryColor || "not set"}) is applied automatically
          unless you override it below.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((type) => {
          const isCustom = customizedTypes.has(type);
          const config = DEFAULT_TEMPLATES[type];
          return (
            <Link
              key={type}
              href={`/dashboard/settings/templates/${type.toLowerCase()}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{type.charAt(0) + type.slice(1).toLowerCase()}</p>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isCustom ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isCustom ? "Customized" : "Default"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {config.pageSize} · {config.orientation} · {config.shape}
              </p>
              <div className="mt-3 h-2 w-full rounded-full" style={{ backgroundColor: config.accentColor }} />
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}
