import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/dashboard/Shell";
import { verifyChain } from "@/lib/security/audit-chain";

// REPLACES your current app/dashboard/audit-logs/page.tsx. Adds:
// search by document number (matches against the log description,
// which already embeds the document number), pagination
// (10/20/50/all via ?limit=), sort by day (?sort=asc|desc), and each
// entry now links to its document when entityType is "Document".
//
// Honest note: the chain-integrity check always runs over the FULL,
// unfiltered log in true write order — that's a separate query from
// the filtered/paginated list you see in the table, and it has to
// stay that way, because checking a chain requires every link, not
// a filtered subset.

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; limit?: string; sort?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organization: true },
  });
  if (!user || user.organizationId !== session.organizationId) redirect("/login");

  const { q, limit: limitParam, sort: sortParam } = await searchParams;
  const search = q?.trim() || "";
  const sort: "asc" | "desc" = sortParam === "asc" ? "asc" : "desc";
  const limit = limitParam || "10";

  // Full chain, unfiltered, true write order — for the integrity check only.
  const allLogsForChain = await prisma.auditLog.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "asc" },
  });
  const chainResult = verifyChain(
    allLogsForChain.map((l) => ({
      organizationId: l.organizationId,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      description: l.description,
      createdAt: l.createdAt,
      previousHash: l.previousHash,
      entryHash: l.entryHash,
    }))
  );

  // Filtered, sorted, paginated — for the table you actually see.
  const where = {
    organizationId: session.organizationId,
    ...(search ? { description: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const totalMatching = await prisma.auditLog.count({ where });
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: sort },
    take: limit === "all" ? undefined : parseInt(limit, 10) || 10,
  });

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams({ q: search, limit, sort, ...overrides });
    if (!params.get("q")) params.delete("q");
    return `/dashboard/audit-logs?${params.toString()}`;
  }

  return (
    <Shell activeHref="/dashboard/audit-logs" userName={user.name} userRole={user.role} orgName={user.organization.name}>
      <div className="mb-8 mt-1">
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Audit Logs</h1>
        <p className="mt-2 text-slate-500">A tamper-evident record of every action taken in your organization.</p>
      </div>

      <div
        className={`mb-6 flex items-center gap-3 rounded-xl border p-4 ${
          chainResult.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
        }`}
      >
        <span className="text-xl">{chainResult.ok ? "✅" : "⚠️"}</span>
        <div>
          <p className={`font-semibold ${chainResult.ok ? "text-green-800" : "text-red-800"}`}>
            {chainResult.ok
              ? "Integrity check passed"
              : `Integrity check FAILED at entry #${(chainResult.brokenAt ?? 0) + 1}`}
          </p>
          <p className={`text-sm ${chainResult.ok ? "text-green-700" : "text-red-700"}`}>
            {chainResult.ok
              ? `All ${chainResult.totalEntries} chained entries are unmodified since they were written.`
              : "One or more entries in this log do not match their recorded hash — the history may have been altered outside the application."}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form action="/dashboard/audit-logs" className="flex flex-1 gap-2">
          <input type="hidden" name="limit" value={limit} />
          <input type="hidden" name="sort" value={sort} />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by document number..."
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Search
          </button>
          {search && (
            <Link href={buildUrl({ q: "" })} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Clear
            </Link>
          )}
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {["10", "20", "50", "all"].map((n) => (
              <Link
                key={n}
                href={buildUrl({ limit: n })}
                className={`rounded-md px-3 py-1 text-xs font-semibold ${
                  limit === n ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {n === "all" ? "All" : n}
              </Link>
            ))}
          </div>
          <Link
            href={buildUrl({ sort: sort === "asc" ? "desc" : "asc" })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            {sort === "desc" ? "Newest first ↓" : "Oldest first ↑"}
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">
            {search ? `Results for "${search}"` : "Recent Activity"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Showing {logs.length} of {totalMatching} matching entries.
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">📜</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              {search ? "No matching entries" : "No activity yet"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {search
                ? "Try a different document number, or clear the search."
                : "Actions like issuing documents, updating templates, or changing your logo will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">When</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{log.description || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(log.createdAt).toLocaleString("en-GB")}</td>
                    <td className="px-6 py-4 text-right">
                      {log.entityType === "Document" && log.entityId ? (
                        <Link href={`/dashboard/documents/${log.entityId}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          View
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-300">—</span>
                      )}
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
