import Link from "next/link";

// components/dashboard/Shell.tsx
//
// Extracted from your existing dashboard/documents pages so every
// page shares the exact same header + sidebar instead of copy-pasting
// it into every new file. Same nav items, same links, same styling
// as what you already have — just reusable now.
//
// Usage in a page:
//   <Shell activeHref="/dashboard/certificates" userName={user.name} userRole={user.role} orgName={user.organization.name}>
//     ...page content...
//   </Shell>

const NAV_SECTIONS = [
  {
    label: "Security Printing",
    items: [
      { label: "Documents", href: "/dashboard/documents" },
      { label: "Credentials", href: "/dashboard/credentials" },
      { label: "Certificates", href: "/dashboard/certificates" },
      { label: "IDs", href: "/dashboard/ids" },
      { label: "Tickets", href: "/dashboard/tickets" },
      { label: "Events", href: "/dashboard/events" },
      { label: "Letters", href: "/dashboard/letters" },
      { label: "Badges", href: "/dashboard/badges" },
      { label: "Passes", href: "/dashboard/passes" },
      { label: "Receipts", href: "/dashboard/receipts" },
      { label: "Access", href: "/dashboard/access" },
      { label: "Admissions", href: "/dashboard/admissions" },
      { label: "Permits", href: "/dashboard/permits" },
      { label: "Licences", href: "/dashboard/licences" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Verification", href: "/dashboard/verification" },
      { label: "Audit Logs", href: "/dashboard/audit-logs" },
      { label: "Settings", href: "/dashboard/settings" },
    ],
  },
];

export function Shell({
  activeHref,
  userName,
  userRole,
  orgName,
  children,
}: {
  activeHref: string;
  userName: string;
  userRole: string;
  orgName: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
            F
          </div>
          <div>
            <h1 className="font-bold text-slate-900">Firmatel</h1>
            <p className="text-xs text-slate-500">Secure document infrastructure</p>
          </div>
        </Link>

        <div className="flex items-center gap-5">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{userName}</p>
            <p className="text-xs text-slate-500">{userRole.replaceAll("_", " ")}</p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden min-h-[calc(100vh-4rem)] w-64 border-r border-slate-200 bg-white lg:block">
          <nav className="space-y-1 p-4">
            <SidebarLink label="Dashboard" href="/dashboard" active={activeHref === "/dashboard"} />

            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <div className="pb-2 pt-5">
                  <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {section.label}
                  </p>
                </div>
                {section.items.map((item) => (
                  <SidebarLink
                    key={item.href}
                    label={item.label}
                    href={item.href}
                    active={activeHref === item.href}
                  />
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1 p-6 lg:p-8">
          <p className="text-sm font-medium text-blue-600">{orgName}</p>
          {children}
        </section>
      </div>
    </main>
  );
}

function SidebarLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
        active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}
