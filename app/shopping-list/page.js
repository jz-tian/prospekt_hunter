import { SiteShell } from "@/components/site-shell";
import { ShoppingListClient } from "@/components/shopping-list-client";
import { listShoppingItems } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ShoppingListPage() {
  const items = JSON.parse(JSON.stringify(listShoppingItems()));

  return (
    <SiteShell>
      <section className="section">
        <div className="section-header">
          <div>
            <h3>Einkaufsliste</h3>
            <p>Merkliste statt Checkout. Angebote aus allen Märkten lassen sich gesammelt planen.</p>
          </div>
        </div>

        <ShoppingListClient initialItems={items} />
      </section>
    </SiteShell>
  );
}
