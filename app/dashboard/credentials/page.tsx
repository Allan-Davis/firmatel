import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/dashboard/Shell";

export default async function CredentialsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organization: true },
  });
  if (!user || user.organizationId !== session.organizationId) redirect("/login");

  const credentials = await prisma.credential.findMany({
    where: { organizationId: session.organizationId },
    include: { recipient: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <Shell activeHref="/dashboard/credentials" userName={user.name} userRole={user.role} orgName={user.organization.name}>
      <div className="mb-8 mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Credentials</h1>
          <p className="mt-2 text-slate-500">Manage your organization&apos;s issued credentials.</p>
        </div>
        <Link
          href="/dashboard/credentials/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          + Create Credential
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">All Credentials</h2>
          <p className="mt-1 text-sm text-slate-500">
            {credentials.length} credential{credentials.length === 1 ? "" : "s"} found.
          </p>
        </div>

        {credentials.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">🪪</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No credentials yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Create your first credential to begin.
            </p>
            <Link
              href="/dashboard/credentials/new"
              className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create your first credential
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Credential</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {credentials.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{c.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{c.credentialNumber}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {c.recipient?.fullName || <span className="text-slate-400">No recipient</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{c.credentialType}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(c.issueDate).toLocaleDateString("en-GB")}
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
