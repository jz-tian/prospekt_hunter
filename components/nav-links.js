"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="site-nav">
      <Link href="/" className={`nav-link${pathname === "/" ? " active" : ""}`}>
        Start
      </Link>
    </nav>
  );
}
