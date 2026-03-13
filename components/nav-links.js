"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingListNavLink } from "@/components/shopping-list-nav-link";

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="site-nav">
      <Link href="/" className={`nav-link${pathname === "/" ? " active" : ""}`}>
        Start
      </Link>
      <Link href="/offers" className={`nav-link${pathname.startsWith("/offers") ? " active" : ""}`}>
        Angebote
      </Link>
      <Link href="/prospekte" className={`nav-link${pathname.startsWith("/prospekte") ? " active" : ""}`}>
        Prospekte
      </Link>
      <ShoppingListNavLink />
    </nav>
  );
}
