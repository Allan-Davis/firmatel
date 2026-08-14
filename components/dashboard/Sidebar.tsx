"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { guillocheDataUri } from "@/lib/security/guilloche";

const NAV_GROUPS = [
  {
    label: "Security Printing",
    items: [
      { href: "/dashboard/documents", label: "Documents" },
      { href: "/dashboard/credentials", label: "Credentials" },
      { href: "/dashboard/certificates", label: "Certificates" },
      { href: "/dashboard/ids", label: "IDs" },
      { href: "/dashboard/tickets", label: "Tickets" },
      { href: "/dashboard/events", label: "Events" },
      { href: "/dashboard/letters", label: "Letters" },
      { href: "/dashboard/badges", label: "Badges" },
      { href: "/dashboard/passes", label: "Passes" },
      { href: "/dashboard/receipts", label: "Receipts" },
    ],
  },
  {
    label: "Trust & Access",
    items: [
      { href: "/dashboard/access", label: "Access" },
      { href: "/dashboard/admissions", label: "Admissions" },
      { href: "/dashboard/verification", label: "Verification" },
      { href: "/dashboard/audit", label: "Audit Log" },
    ],
  },
  {
    label: "Organization",
    items: [
      { href: "/dashboard/users", label: "Users" },
      { href: "/dashboard/departments", label: "Departments" },
      { href: "/dashboard/settings", label: "Settings" },
    ],
  },
];

export function Sidebar({
  orgName = "Firmatel",
  orgSeed = "firmatel-default",
}: {
  orgName?: string;
  orgSeed?: string;
}) {
  const pathname = usePathname();

  const textureUrl = useMemo(
    () =>
      guillocheDataUri({
        seed: orgSeed,
        width: 480,
        height: 480,
        lineCount: 18,
        strokeWidth: 0.5,
        opacity: 0.14,
      }),
    [orgSeed]
  );

  return (
    <aside
      className="flex h-screen w-64 flex-col border-r"
      style={{
        background: "var(--ink-950)",
        borderColor: "var(--ink-700)",
        backgroundImage: `url("${textureUrl}")`,
        backgroundSize: "480px 480px",
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-6"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center font-data text-sm font-semibold"
          style={{
            background: "var(--ink-900)",
            border: "1px solid var(--brass-500)",
            color: "var(--brass-400)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          F
        </div>
        <div>
          <div
            className="font-display text-base leading-tight"
            style={{ color: "var(--text-primary-on-dark)" }}
          >
            {orgName}
          </div>
          <div
            className="text-[11px] uppercase tracking-widest"
            style={{ color: "var(--text-secondary-on-dark)" }}
          >
            Secure Document Infrastructure
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-6">
            <div
              className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--brass-600)" }}
            >
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-2 px-2 py-1.5 text-sm transition-colors"
                      style={{
                        borderRadius: "var(--radius-sm)",
                        color: active ? "var(--text-primary-on-dark)" : "var(--text-secondary-on-dark)",
                        background: active ? "var(--ink-800)" : "transparent",
                        borderLeft: active ? "2px solid var(--brass-500)" : "2px solid transparent",
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
