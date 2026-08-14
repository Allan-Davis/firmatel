import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/dashboard/Shell";

// app/dashboard/[category]/page.tsx
//
// ONE page that serves 11 of your sidebar links: Certificates, IDs,
// Events, Letters, Badges, Passes, Receipts, Access, Admissions,
// Permits, Licences. Each of these is a Document row filtered by
// documentType — exactly how "Certificates" already worked on your
// dashboard. This does NOT touch /dashboard/documents,
// /dashboard/credentials, /dashboard/tickets, /dashboard/verification,
// or /dashboard/audit-logs — those have their own dedicated pages
// (see the other files) since they use different database tables.
//
// If any of these categories are actually meant to work differently
// in your business logic (e.g. "Events" should list Tickets grouped
// by event, not Documents), tell me and I'll split that one out.

const CATEGORY_MAP: Record<string, { label: string; documentType: string }> = {
  certificates: { label: "Certificates", documentType: "CERTIFICATE" },
  ids: { label: "IDs", documentType: "ID" },
  events: { label: "Events", documentType: "EVENT" },
  letters: { label: "Letters", documentType: "LETTER" },
  badges: { label: "Badges", documentType: "BADGE" },
  passes: { label: "Passes", documentType: "PASS" },
  receipts: { label: "Receipts", documentType: "RECEIPT" },
  access: { label: "Access", documentType: "ACCESS" },
  admissions: { label: "Admissions", documentType: "ADMISSION" },
  permits: { label: "Permits", documentType: "PERMIT" },
  licences: { label: "Licences", documentType: "LICENCE" },
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const config = CATEGORY_MAP[category];
  if (!config) {
    notFound();
  }

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organization: true },
  });

  if (!user || user.organizationId !== session.organizationId) {
    redirect("/login");
  }

  const items = await prisma.document.findMany({
    where: {
      organizationId: session.organizationId,
      documentType: config.documentType,
    },
    include: { recipient: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <Shell
      activeHref={`/dashboard/${category}`}
      userName={user.name}
      userRole={user.role}
      orgName={user.organization.name}
    >
      <div className="mb-8 mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{config.label}</h1>
          <p className="mt-2 text-slate-500">
            Create, manage and verify your organization&apos;s {config.label.toLowerCase()}.
          </p>
        </div>

        <Link
          href={`/dashboard/documents/new?type=${config.documentType}`}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          + Create {config.label.replace(/s$/, "")}
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard title={`Total ${config.label}`} value={items.length} />
        <SummaryCard title="Issued" value={items.filter((i) => i.status === "ISSUED").length} />
        <SummaryCard title="Revoked" value={items.filter((i) => i.status === "REVOKED").length} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">All {config.label}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {items.length} record{items.length === 1 ? "" : "s"} found.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
              📄
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No {config.label.toLowerCase()} yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Create your first {config.label.toLowerCase().replace(/s$/, "")} to begin.
            </p>
            <Link
              href={`/dashboard/documents/new?type=${config.documentType}`}
              className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create your first {config.label.toLowerCase().replace(/s$/, "")}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {config.label.replace(/s$/, "")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Issued
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.documentNumber}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.recipient?.fullName || <span className="text-slate-400">No recipient</span>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(item.issueDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/documents/${item.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ISSUED: "bg-green-50 text-green-700",
    DRAFT: "bg-slate-100 text-slate-700",
    REVOKED: "bg-red-50 text-red-700",
    EXPIRED: "bg-orange-50 text-orange-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}
