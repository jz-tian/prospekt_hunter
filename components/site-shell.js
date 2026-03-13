import { NavLinks } from "@/components/nav-links";
import { CartHeaderButton } from "@/components/cart-header-button";
import { ShoppingListDrawer } from "@/components/shopping-list-drawer";

export function SiteShell({ children }) {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-rh">RH·</span>
            <span className="brand-name">RabattHunter</span>
          </div>

          <NavLinks />

          <form className="header-search" action="/offers" method="get">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="search"
              name="search"
              className="search-input"
              placeholder="Produkte suchen…"
              aria-label="Produktsuche"
            />
          </form>

          <CartHeaderButton />
        </div>
      </header>

      <div className="shell">
        {children}
      </div>

      <ShoppingListDrawer />
    </>
  );
}
