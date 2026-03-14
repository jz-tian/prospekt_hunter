import { CartHeaderButton } from "@/components/cart-header-button";
import { DemoBanner } from "@/components/demo-banner";
import { ShoppingListDrawer } from "@/components/shopping-list-drawer";

export function SiteShell({ children }) {
  return (
    <>
      <DemoBanner />
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <img src="/logo.svg" alt="RabattHunter" className="brand-logo" />
            <span className="brand-byline">by Jiazheng Tian</span>
          </div>

          <form className="header-search" action="/" method="get">
            <img src="/logo.svg" alt="" className="search-logo" aria-hidden="true" />
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
