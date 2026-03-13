export function OffersFilter({ retailers, categories, searchParams }) {
  return (
    <div className="filters">
      <form>
        <input type="hidden" name="week" value={searchParams.week ?? "current"} />
        <input
          className="search-input-field"
          type="search"
          name="search"
          placeholder="Produkte oder Marken suchen"
          defaultValue={searchParams.search ?? ""}
        />
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
          <option value="">Standard</option>
          <option value="price_asc">Preis aufsteigend</option>
          <option value="price_desc">Preis absteigend</option>
          <option value="name">Name A-Z</option>
        </select>
        <button className="cta" type="submit">
          Filtern
        </button>
      </form>
    </div>
  );
}
