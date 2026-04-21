import { SiteShell } from "@/components/site-shell";
import { ShoppingListClient } from "@/components/shopping-list-client";
import { listShoppingItems } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ShoppingListPage() {
  const items = JSON.parse(JSON.stringify(await listShoppingItems()));

  return (
    <SiteShell>
      <div className="page-hero" style={{ marginBottom: 0 }}>
        <div className="lead">
          <h1>
            <span className="jp">買 物 帳 · EINKAUFSLISTE</span>
            Mein Korb
          </h1>
          <p>Sortiert nach Händler — wie ein Quittungs-Block aus dem Tante-Emma-Laden.</p>
        </div>
        <div className="stats">
          <div className="stat">
            <div className="n">{items.length}</div>
            <div className="l">Positionen</div>
          </div>
        </div>
      </div>

      <ShoppingListClient initialItems={items} />
    </SiteShell>
  );
}
