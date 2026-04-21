"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/",          label: "Markt",        jp: "市場" },
  { href: "/offers",    label: "Angebote",     jp: "特売" },
  { href: "/prospekte", label: "Prospekte",    jp: "広告" },
  { href: "/shopping-list", label: "Einkaufsliste", jp: "買物" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={pathname === l.href ? "on" : ""}>
          <span className="jp-hint">{l.jp}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
