"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const LINKS: Array<{
  href: string;
  label: string;
  short: string;
  exact?: boolean;
}> = [
  { href: "/admin", label: "Overview", short: "Home", exact: true },
  { href: "/admin/approvals", label: "Approvals", short: "Approve" },
  { href: "/admin/users", label: "Users", short: "Users" },
  { href: "/admin/content", label: "Content", short: "Content" },
  { href: "/admin/insights", label: "Insights", short: "Insights" },
  { href: "/admin/system", label: "System", short: "System" },
];

export function AdminNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const active = navRef.current?.querySelector(".admin-nav-link.is-active");
    if (active instanceof HTMLElement) {
      active.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [pathname]);

  return (
    <nav className="admin-nav" aria-label="Admin" ref={navRef}>
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
            <span className="admin-nav-label-full">{link.label}</span>
            <span className="admin-nav-label-short">{link.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
