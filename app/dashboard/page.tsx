import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    include: {
      organization: true,
    },
  });

  if (!user || user.organizationId !== session.organizationId) {
    redirect("/login");
  }

  const [
    documentCount,
    credentialCount,
    ticketCount,
    certificateCount,
    userCount,
    recipientCount,
    departmentCount,
    verificationCount,
  ] = await Promise.all([
    prisma.document.count({
      where: {
        organizationId: session.organizationId,
      },
    }),

    prisma.credential.count({
      where: {
        organizationId: session.organizationId,
      },
    }),

    prisma.ticket.count({
      where: {
        organizationId: session.organizationId,
      },
    }),

    prisma.document.count({
      where: {
        organizationId: session.organizationId,
        documentType: "CERTIFICATE",
      },
    }),

    prisma.user.count({
      where: {
        organizationId: session.organizationId,
      },
    }),

    prisma.recipient.count({
      where: {
        organizationId: session.organizationId,
      },
    }),

    prisma.department.count({
      where: {
        organizationId: session.organizationId,
      },
    }),

    prisma.verificationEvent.count({
      where: {
        document: {
          organizationId: session.organizationId,
        },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
            F
          </div>

          <div>
            <h1 className="font-bold text-slate-900">Firmatel</h1>

            <p className="text-xs text-slate-500">
              Secure document infrastructure
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-5">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">
              {user.name}
            </p>

            <p className="text-xs text-slate-500">
              {user.role.replaceAll("_", " ")}
            </p>
          </div>

          <LogoutButton />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden min-h-[calc(100vh-4rem)] w-64 border-r border-slate-200 bg-white lg:block">
          <nav className="space-y-1 p-4">
            <SidebarItem
              label="Dashboard"
              href="/dashboard"
              active
            />

            <div className="pb-2 pt-5">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Security Printing
              </p>
            </div>

            <SidebarItem
              label="Documents"
              href="/dashboard/documents"
            />

            <SidebarItem
              label="Credentials"
              href="/dashboard/credentials"
            />

            <SidebarItem
              label="Certificates"
              href="/dashboard/certificates"
            />

            <SidebarItem
              label="IDs"
              href="/dashboard/ids"
            />

            <SidebarItem
              label="Tickets"
              href="/dashboard/tickets"
            />

            <SidebarItem
              label="Events"
              href="/dashboard/events"
            />

            <SidebarItem
              label="Letters"
              href="/dashboard/letters"
            />

            <SidebarItem
              label="Badges"
              href="/dashboard/badges"
            />

            <SidebarItem
              label="Passes"
              href="/dashboard/passes"
            />

            <SidebarItem
              label="Receipts"
              href="/dashboard/receipts"
            />

            <SidebarItem
              label="Access"
              href="/dashboard/access"
            />

            <SidebarItem
              label="Admissions"
              href="/dashboard/admissions"
            />

            <SidebarItem
              label="Permits"
              href="/dashboard/permits"
            />

            <SidebarItem
              label="Licences"
              href="/dashboard/licences"
            />

            <div className="pb-2 pt-5">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                System
              </p>
            </div>

            <SidebarItem
              label="Verification"
              href="/dashboard/verification"
            />

            <SidebarItem
              label="Audit Logs"
              href="/dashboard/audit-logs"
            />

            <SidebarItem
              label="Settings"
              href="/dashboard/settings"
            />
          </nav>
        </aside>

        {/* Main */}
        <section className="flex-1 p-6 lg:p-8">
          <div className="mb-8">
            <p className="text-sm font-medium text-blue-600">
              {user.organization.name}
            </p>

            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h2>

            <p className="mt-2 text-slate-500">
              Manage your organization&apos;s secure documents and
              credentials.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Documents"
              value={documentCount}
              description="Total documents"
              href="/dashboard/documents"
            />

            <StatCard
              title="Credentials"
              value={credentialCount}
              description="Total credentials"
              href="/dashboard/credentials"
            />

            <StatCard
              title="Certificates"
              value={certificateCount}
              description="Issued certificates"
              href="/dashboard/certificates"
            />

            <StatCard
              title="Tickets"
              value={ticketCount}
              description="Total tickets"
              href="/dashboard/tickets"
            />
          </div>

          {/* Organization overview */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              title="Users"
              value={userCount}
              href="/dashboard/users"
            />

            <InfoCard
              title="Recipients"
              value={recipientCount}
              href="/dashboard/recipients"
            />

            <InfoCard
              title="Departments"
              value={departmentCount}
              href="/dashboard/departments"
            />

            <InfoCard
              title="Verifications"
              value={verificationCount}
              href="/dashboard/verification"
            />
          </div>

          {/* Quick actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-900">
              Quick actions
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ActionCard
                title="Create Document"
                description="Issue a secure document"
                href="/dashboard/documents/new"
              />

              <ActionCard
                title="Create Credential"
                description="Issue a credential"
                href="/dashboard/credentials/new"
              />

              <ActionCard
                title="Create Certificate"
                description="Issue a certificate"
                href="/dashboard/certificates/new"
              />

              <ActionCard
                title="Create Ticket"
                description="Create a secure ticket"
                href="/dashboard/tickets/new"
              />
            </div>
          </div>

          {/* Recent activity */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="font-semibold text-slate-900">
                Recent activity
              </h3>
            </div>

            <div className="px-6 py-10 text-center">
              <p className="text-slate-500">
                No activity yet.
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Issued documents and security events will appear
                here.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SidebarItem({
  label,
  active = false,
  href,
}: {
  label: string;
  active?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

function StatCard({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"
    >
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </Link>
  );
}

function InfoCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"
    >
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </Link>
  );
}

function ActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
        +
      </div>

      <h4 className="mt-4 font-semibold text-slate-900">
        {title}
      </h4>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </Link>
  );
}