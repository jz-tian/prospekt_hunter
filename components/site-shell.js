import { NavLinks } from "@/components/nav-links";
import { CartHeaderButton } from "@/components/cart-header-button";
import { ShoppingListDrawer } from "@/components/shopping-list-drawer";

export function SiteShell({ children }) {
  return (
    <>
      <header className="site-header">
        <div className="header-top">
          <div className="header-inner">
            <div className="brand">
              <span className="brand-rh">RH·</span>
              <span className="brand-name">RabattHunter</span>
            </div>

            <div className="header-search">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="search"
                className="search-input"
                placeholder="Produkte suchen…"
                disabled
                aria-label="Produktsuche (demnächst verfügbar)"
              />
            </div>

            <CartHeaderButton />
          </div>
        </div>

        <div className="header-nav">
          <div className="header-inner">
            <NavLinks />
          </div>
        </div>
      </header>

      <div className="shell">
        {children}
      </div>

      <ShoppingListDrawer />
    </>
  );
}
