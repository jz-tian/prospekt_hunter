import Link from "next/link";
import { CartHeaderButton } from "@/components/cart-header-button";
import { DemoBanner } from "@/components/demo-banner";
import { NavLinks } from "@/components/nav-links";
import { ShoppingListDrawer } from "@/components/shopping-list-drawer";

export function SiteShell({ children }) {
  return (
    <>
      <DemoBanner />
      <header className="fascia">
        <div className="shell fascia-inner">
          <div className="logo-block">
            <Link href="/" className="logo-frame">
              <span className="jp-sub">ラバット ハンター</span>
              <span className="wordmark">Rabatt<em>Hunter</em></span>
            </Link>
            <div className="hanko">昭<small>和</small></div>
          </div>
          <NavLinks />
          <CartHeaderButton />
        </div>
      </header>

      <main>
        <div className="shell">
          {children}
        </div>
      </main>

      <footer className="foot">
        <div className="shell">
          <span className="motif">◇ ━ 商店街 ━ ◇</span>
          <span>RABATTHUNTER · WOCHEN-ANGEBOTE · BRD · SHŌWA-AUSGABE</span>
          <span>© 2026 · <a href="https://jiazheng.dev" target="_blank" rel="noreferrer">Jiazheng Tian</a> · Kein Ableger der Händler</span>
        </div>
      </footer>

      <ShoppingListDrawer />
    </>
  );
}
