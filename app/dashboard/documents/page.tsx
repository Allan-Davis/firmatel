import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// REPLACES your current app/dashboard/documents/page.tsx. Adds
// sorting (?sort=issueDate|type|status|expiryDate, ?dir=asc|desc)
// and a status filter (?status=ALL|DRAFT|ISSUED|REVOKED|EXPIRED).
// Everything else — the header, sidebar, summary cards, table
// columns — is exactly what you already had.
//
// Note: there's no "deleted" status in your schema — the Delete
// button on a document's detail page permanently removes the row,
// it doesn't mark it as deleted. So a deleted document can't show up
// filtered in a list; it's gone. If you'd rather deletions be
// reversible (an archive/soft-delete instead of permanent removal),
// that's a real schema change (add a DELETED status or a deletedAt
// column) — tell me if you want that built instead of hard deletes.

const SORT_FIELDS = {
  issueDate: "issueDate",
  type: "documentType",
  status: "status",
  expiryDate: "expiryDate",
} as const;
type SortKey = keyof typeof SORT_FIELDS;

const STATUS_OPTIONS = ["ALL", "DRAFT", "ISSUED", "REVOKED", "EXPIRED"] as const;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string; status?: string }>;
}) {
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

  const { sort: sortParam, dir: dirParam, status: statusParam } = await searchParams;
  const sortKey: SortKey = (sortParam && sortParam in SORT_FIELDS ? sortParam : "issueDate") as SortKey;
  const dir: "asc" | "desc" = dirParam === "asc" ? "asc" : "desc";
  const statusFilter = STATUS_OPTIONS.includes((statusParam as any) ?? "ALL") ? statusParam || "ALL" : "ALL";

  const documents = await prisma.document.findMany({
    where: {
      organizationId: session.organizationId,
      ...(statusFilter !== "ALL" ? { status: statusFilter as any } : {}),
    },
    include: { recipient: true },
    orderBy: { [SORT_FIELDS[sortKey]]: dir },
    take: 200,
  });

  function sortUrl(key: SortKey) {
    const nextDir = sortKey === key && dir === "desc" ? "asc" : "desc";
    const params = new URLSearchParams({ sort: key, dir: nextDir, status: statusFilter });
    return `/dashboard/documents?${params.toString()}`;
  }

  function statusUrl(status: string) {
    const params = new URLSearchParams({ sort: sortKey, dir, status });
    return `/dashboard/documents?${params.toString()}`;
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return "";
    return dir === "asc" ? " ↑" : " ↓";
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div>
          <Link href="/dashboard" className="font-bold text-slate-900">
            Firmatel
          </Link>
          <p className="text-xs text-slate-500">Secure document infrastructure</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.role.replaceAll("_", " ")}</p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl p-6 lg:p-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">{user.organization.name}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Documents</h1>
            <p className="mt-2 text-slate-500">Create, manage and verify your organization&apos;s secure documents.</p>
          </div>

          <Link
            href="/dashboard/documents/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Create Document
          </Link>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard title="Total Documents" value={documents.length} />
          <SummaryCard title="Issued" value={documents.filter((d) => d.status === "ISSUED").length} />
          <SummaryCard title="Revoked" value={documents.filter((d) => d.status === "REVOKED").length} />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status:</span>
          {STATUS_OPTIONS.map((s) => (
            <Link
              key={s}
              href={statusUrl(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusFilter === s ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold text-slate-900">All Documents</h2>
            <p className="mt-1 text-sm text-slate-500">
              {documents.length} document{documents.length === 1 ? "" : "s"} found.
            </p>
          </div>

          {documents.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">📄</div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No documents found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {statusFilter !== "ALL"
                  ? `No documents with status "${statusFilter}". Try a different filter.`
                  : "Create your first secure document to begin managing your organization's document infrastructure."}
              </p>
              <Link
                href="/dashboard/documents/new"
                className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create your first document
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Document</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Recipient</th>
                    <SortableHeader label="Type" sortKey="type" href={sortUrl("type")} indicator={sortIndicator("type")} />
                    <SortableHeader label="Status" sortKey="status" href={sortUrl("status")} indicator={sortIndicator("status")} />
                    <SortableHeader label="Issued" sortKey="issueDate" href={sortUrl("issueDate")} indicator={sortIndicator("issueDate")} />
                    <SortableHeader label="Expires" sortKey="expiryDate" href={sortUrl("expiryDate")} indicator={sortIndicator("expiryDate")} />
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {documents.map((document) => (
                    <tr key={document.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{document.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{document.documentNumber}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {document.recipient?.fullName || <span className="text-slate-400">No recipient</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{document.documentType}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={document.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(document.issueDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {document.expiryDate ? new Date(document.expiryDate).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/documents/${document.id}`} className="font-medium text-blue-600 hover:text-blue-800">
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
      </section>
    </main>
  );
}

function SortableHeader({ label, href, indicator }: { label: string; sortKey: SortKey; href: string; indicator: string }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
      <Link href={href} className="hover:text-slate-900">
        {label}
        {indicator}
      </Link>
    </th>
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
