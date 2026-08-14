import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/dashboard/Shell";
import { AdminVerifyLookup } from "./AdminVerifyLookup";

export default async function VerificationPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organization: true },
  });
  if (!user || user.organizationId !== session.organizationId) redirect("/login");

  const events = await prisma.verificationEvent.findMany({
    where: { document: { organizationId: session.organizationId } },
    include: { document: true },
    orderBy: { verifiedAt: "desc" },
    take: 100,
  });

  const totalChecks = events.length;
  const validChecks = events.filter((e) => e.result === "VALID").length;
  const anomalous = events.filter((e) => e.isAnomalous).length;

  return (
    <Shell activeHref="/dashboard/verification" userName={user.name} userRole={user.role} orgName={user.organization.name}>
      <div className="mb-8 mt-1">
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Verification</h1>
        <p className="mt-2 text-slate-500">Live record of every public verification check against your documents.</p>
      </div>

      <AdminVerifyLookup />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Checks</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalChecks}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Valid</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{validChecks}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Flagged Anomalous</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{anomalous}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Recent Verification Checks</h2>
        </div>

        {events.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">🔍</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No verification checks yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              When someone scans a QR code or visits a verification link, it will show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Document</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Result</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {events.map((e) => (
                  <tr key={e.id} className={`hover:bg-slate-50 ${e.isAnomalous ? "bg-red-50/40" : ""}`}>
                    <td className="px-6 py-4 text-sm text-slate-900">{e.document?.title || e.verificationCode}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          e.result === "VALID" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {e.result}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{e.ipAddress || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(e.verifiedAt).toLocaleString("en-GB")}
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
