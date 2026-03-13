import Link from "next/link";
import { ShoppingListDrawer } from "@/components/shopping-list-drawer";
import { ShoppingListNavLink } from "@/components/shopping-list-nav-link";

export function SiteShell({ children }) {
  return (
    <div className="shell">
      <header className="site-header">
        <div className="brand">
          <div className="brand-mark">%</div>
          <div className="brand-copy">
            <h1>AngebotsRadar</h1>
            <p>Prospekte, Preise und Einkaufszettel für diese Woche.</p>
          </div>
        </div>

        <nav className="nav">
          <Link href="/" className="nav-link">
            Start
          </Link>
          <Link href="/offers" className="nav-link">
            Angebote
          </Link>
          <Link href="/prospekte" className="nav-link">
            Prospekte
          </Link>
          <ShoppingListNavLink />
        </nav>
      </header>

      {children}
      <ShoppingListDrawer />
    </div>
  );
}
