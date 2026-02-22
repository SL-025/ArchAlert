"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const path = usePathname();

  const Item = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        textDecoration: "none",
        color: path === href ? "#fff" : "#0f172a",
        background: path === href ? "#0f172a" : "transparent",
        border: "1px solid #e5e7eb",
      }}
    >
      {label}
    </Link>
  );

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
      <div style={{ fontWeight: 800, marginRight: 10 }}>ArchAlert</div>
      <Item href="/" label="Dashboard" />
      <Item href="/trends" label="Trends" />
      <Item href="/alerts" label="Alerts" />
      <Item href="/about" label="About" />
    </div>
  );
}