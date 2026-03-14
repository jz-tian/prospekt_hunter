export function OffersFilter({ retailers, categories, searchParams }) {
  return (
    <div className="filters">
      <form className="filter-form">
        <input type="hidden" name="week" value={searchParams.week ?? "current"} />

        <div className="filter-search-wrap">
          <svg className="filter-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="search-input-field"
            type="search"
            name="search"
            placeholder="Produkte oder Marken suchen…"
            defaultValue={searchParams.search ?? ""}
          />
        </div>

        <div className="filter-selects">
          <select className="filter-select" name="retailer" defaultValue={searchParams.retailer ?? ""}>
            <option value="">Alle Märkte</option>
            {retailers.map((retailer) => (
              <option key={retailer.slug} value={retailer.slug}>
                {retailer.name}
              </option>
            ))}
          </select>
          <select className="filter-select" name="category" defaultValue={searchParams.category ?? ""}>
            <option value="">Alle Kategorien</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <select className="filter-select" name="sort" defaultValue={searchParams.sort ?? ""}>
            <option value="">Sortierung</option>
            <option value="price_asc">Preis ↑</option>
            <option value="price_desc">Preis ↓</option>
            <option value="name">Name A–Z</option>
          </select>
          <button className="filter-submit-btn" type="submit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filtern
          </button>
        </div>
      </form>
    </div>
  );
}
