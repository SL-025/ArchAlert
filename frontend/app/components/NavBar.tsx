"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link className={`navLink ${active ? "navLinkActive" : ""}`} href={href}>
      {label}
    </Link>
  );
}

export default function NavBar() {
  return (
    <div className="surface" style={{ padding: 14, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div className="brand">
          <div className="brandMark" />
          <div>
            <div style={{ fontSize: 16 }}>ArchAlert</div>
            <div className="kicker">Urban safety awareness</div>
          </div>
        </div>

        <div className="navPill" style={{ flexWrap: "wrap" }}>
          <NavItem href="/" label="Dashboard" />
          <NavItem href="/trends" label="Trends" />
          <NavItem href="/alerts" label="Alerts" />
          <NavItem href="/about" label="About" />
        </div>
      </div>
    </div>
  );
}