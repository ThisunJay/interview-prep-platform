"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: Array<{ href: string; label: string; exact?: boolean }> = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/approvals", label: "Approvals" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/insights", label: "Insights" },
  { href: "/admin/system", label: "System" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`admin-nav-link${active ? " is-active" : ""}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
