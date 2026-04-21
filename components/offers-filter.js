export function OffersFilter({ retailers, categories, searchParams }) {
  return (
    <form className="filter-board" method="get">
      <input type="hidden" name="week" value={searchParams.week ?? "current"} />

      <div>
        <label htmlFor="filter-search">Suche · 検索</label>
        <div className="search-wrap">
          <input
            id="filter-search"
            className="input"
            type="search"
            name="search"
            placeholder="z. B. Butter, Kaffee, Hack…"
            defaultValue={searchParams.search ?? ""}
          />
          <span className="glass" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round">
              <circle cx="6.5" cy="6.5" r="4" />
              <line x1="9.7" y1="9.7" x2="13.5" y2="13.5" />
              <line x1="4.5" y1="6.5" x2="8.5" y2="6.5" />
              <line x1="6.5" y1="4.5" x2="6.5" y2="8.5" />
            </svg>
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="filter-retailer">Händler · 店</label>
        <select id="filter-retailer" name="retailer" defaultValue={searchParams.retailer ?? ""}>
          <option value="">Alle Händler</option>
          {retailers.map((retailer) => (
            <option key={retailer.slug} value={retailer.slug}>{retailer.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-category">Kategorie · 分類</label>
        <select id="filter-category" name="category" defaultValue={searchParams.category ?? ""}>
          <option value="">Alle Kategorien</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>{category.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-sort">Sortierung · 並</label>
        <select id="filter-sort" name="sort" defaultValue={searchParams.sort ?? ""}>
          <option value="">Standard</option>
          <option value="price_asc">Preis ↑</option>
          <option value="price_desc">Preis ↓</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      <button className="filter-btn" type="submit">
        FILTERN 絞
      </button>
    </form>
  );
}
