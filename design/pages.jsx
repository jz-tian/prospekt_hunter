// Page components — Home, Offers, Prospekte, Shopping list

function HomePage({ week, setWeek, offers, cart, addToCart, setPage }) {
  const stats = week === "current" ? window.STALL_STATS : window.STALL_STATS_NEXT;
  const featured = offers.slice(0, 8);
  return (
    <>
      <section className="shell">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "22px 0 14px", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontFamily: "Noto Serif JP", fontWeight: 900, fontSize: 11, letterSpacing: "0.4em", color: "var(--red)" }}>今週の特売 · KW 17</div>
            <h1 className="display" style={{ fontSize: 40, lineHeight: 1, marginTop: 4 }}>Der Wochenmarkt der Rabatte</h1>
            <p style={{ fontStyle: "italic", color: "var(--muted)", marginTop: 6, maxWidth: 560 }}>
              Fünf Händler, ein Schaufenster. Wählen Sie die Woche — füllen Sie den Korb.
            </p>
          </div>
          <WeekSwitch week={week} setWeek={setWeek} />
        </div>
      </section>

      <section className="shell">
        <Signboard jp="五 つ の 店" title="Händler im Markt" sub="Fünf Prospekte, täglich frisch abgegriffen" />
        <div className="stall-grid stagger">
          {window.RETAILERS.map(r => <StallCard key={r.id} retailer={r} stat={stats[r.id]} />)}
        </div>
      </section>

      <section className="shell">
        <Signboard jp="本 日 の 目 玉" title="Aktuelle Angebote" sub="Auswahl aus 678 Angeboten dieser Woche" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em" }}>
            ANGEZEIGT: {featured.length} / {offers.length}
          </span>
          <a className="stamp-type" style={{ background: "var(--text)", color: "var(--bg)", padding: "6px 14px", border: "2px solid var(--border)", boxShadow: "var(--shadow)", cursor: "pointer", fontSize: 12 }} onClick={() => setPage("offers")}>
            Alle Angebote ansehen →
          </a>
        </div>
        <div className="offers-wrap">
          <div className="offers-grid stagger">
            {featured.map(o => {
              const r = window.RETAILERS.find(x => x.id === o.retailerId);
              return <OfferCard key={o.id} offer={o} retailer={r} inCart={!!cart[o.id]} onAdd={addToCart} />;
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function OffersPage({ offers, cart, addToCart }) {
  const [q, setQ] = React.useState("");
  const [retailer, setRetailer] = React.useState("all");
  const [cat, setCat] = React.useState("all");
  const [sort, setSort] = React.useState("discount");
  const [chip, setChip] = React.useState("all");

  const filtered = React.useMemo(() => {
    let list = offers.filter(o => {
      if (q && !o.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (retailer !== "all" && o.retailerId !== retailer) return false;
      if (cat !== "all" && o.cat !== cat) return false;
      if (chip === "bio" && !o.tags.includes("bio")) return false;
      if (chip === "tipp" && !o.tags.includes("tipp")) return false;
      if (chip === "neu" && !o.tags.includes("neu")) return false;
      if (chip === "big" && o.discount < 30) return false;
      return true;
    });
    list = [...list];
    if (sort === "discount") list.sort((a,b) => b.discount - a.discount);
    if (sort === "price") list.sort((a,b) => a.price - b.price);
    if (sort === "name") list.sort((a,b) => a.title.localeCompare(b.title));
    return list;
  }, [offers, q, retailer, cat, sort, chip]);

  const chips = [
    { id: "all",  l: "Alle" },
    { id: "bio",  l: "Bio 🌿" },
    { id: "tipp", l: "Tipp der Woche" },
    { id: "neu",  l: "Neu diese Woche" },
    { id: "big",  l: "Mindestens −30%" }
  ];

  return (
    <section className="shell">
      <div className="page-hero">
        <div className="lead">
          <h1><span className="jp">特売 一覧 · ANGEBOTE</span>Alle Angebote dieser Woche</h1>
          <p>Durchsuchen, vergleichen, sammeln. Filtern Sie nach Händler, Kategorie oder dem größten Rabatt — und legen Sie alles in Ihren Korb.</p>
        </div>
        <div className="stats">
          <div className="stat"><div className="n">{offers.length}</div><div className="l">Angebote</div></div>
          <div className="stat"><div className="n">5</div><div className="l">Händler</div></div>
          <div className="stat"><div className="n">−{Math.max(...offers.map(o => o.discount))}%</div><div className="l">Top-Rabatt</div></div>
        </div>
      </div>

      <div className="filter-board" style={{ marginTop: 18 }}>
        <div>
          <label>Suche · 検索</label>
          <div className="search-wrap">
            <input className="input" placeholder="z. B. Butter, Kaffee, Hack…" value={q} onChange={e => setQ(e.target.value)} />
            <span className="glass"><GlassIcon /></span>
          </div>
        </div>
        <div>
          <label>Händler · 店</label>
          <select value={retailer} onChange={e => setRetailer(e.target.value)}>
            <option value="all">Alle Händler</option>
            {window.RETAILERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label>Kategorie · 分類</label>
          <select value={cat} onChange={e => setCat(e.target.value)}>
            {window.CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label>Sortierung · 並</label>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="discount">Größter Rabatt</option>
            <option value="price">Günstigster Preis</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>
        <button className="filter-btn" onClick={() => { setQ(""); setRetailer("all"); setCat("all"); setChip("all"); }}>
          ZURÜCK 戻
        </button>
      </div>

      <div className="chip-row">
        {chips.map(c => (
          <button key={c.id} className={"chip" + (chip === c.id ? " on" : "")} onClick={() => setChip(c.id)}>{c.l}</button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "20px 0 10px", fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.12em", color: "var(--muted)" }}>
        <span>ERGEBNIS: {filtered.length} / {offers.length} ANGEBOTE</span>
        <span>◆ ◆ ◆</span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", border: "2px dashed var(--border-soft)", background: "var(--surface)" }}>
          <EmptyBasket size={72} />
          <p style={{ fontStyle: "italic", color: "var(--muted)", marginTop: 14, fontSize: 15 }}>Heute leer geblieben — keine Angebote passen zu Ihrer Suche.</p>
        </div>
      ) : (
        <div className="offers-wrap">
          <div className="offers-grid stagger">
            {filtered.map(o => {
              const r = window.RETAILERS.find(x => x.id === o.retailerId);
              return <OfferCard key={o.id} offer={o} retailer={r} inCart={!!cart[o.id]} onAdd={addToCart} />;
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function ProspektePage() {
  return (
    <section className="shell">
      <div className="page-hero">
        <div className="lead">
          <h1><span className="jp">広 告 集 · PROSPEKTE</span>Wochenprospekte</h1>
          <p>Die gesammelten Handzettel der Woche — wie der alte Prospekt-Stapel im Briefkasten, nur ohne Papier.</p>
        </div>
        <div className="stats">
          <div className="stat"><div className="n">{window.PROSPEKTE.length}</div><div className="l">Hefte</div></div>
          <div className="stat"><div className="n">{window.PROSPEKTE.reduce((s,p) => s + p.pages, 0)}</div><div className="l">Seiten</div></div>
        </div>
      </div>

      <Signboard jp="今 週 の 広 告" title="Aktuelle Prospekte" sub="Klicken Sie auf ein Heft, um die Angebote zu öffnen" />

      <div className="prospekt-grid stagger">
        {window.PROSPEKTE.map(p => {
          const r = window.RETAILERS.find(x => x.id === p.retailerId);
          return (
            <div key={p.id} className="prospekt">
              <span className="c3" /><span className="c4" />
              <div className="cover">
                <div className="cover-label">
                  <span className="w">{r.name}</span>
                  <span className="s">{p.cover}</span>
                </div>
              </div>
              <h3>{p.title}</h3>
              <div className="meta">{p.pages} Seiten · {p.valid}</div>
              <a className="view-btn">Angebote anzeigen →</a>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ShoppingListPage({ cart, offers, removeItem, setQty, toggleDone }) {
  const items = Object.values(cart);
  const groups = window.RETAILERS
    .map(r => ({ r, items: items.filter(it => it.retailerId === r.id) }))
    .filter(g => g.items.length > 0);
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  const wasTotal = items.reduce((s, it) => s + it.was * it.qty, 0);
  const saved = wasTotal - total;
  const fmt = n => n.toFixed(2).replace(".", ",") + " €";

  return (
    <section className="shell">
      <div className="page-hero">
        <div className="lead">
          <h1><span className="jp">買 物 帳 · EINKAUFSLISTE</span>Mein Korb</h1>
          <p>Sortiert nach Händler — wie ein Quittungs-Block aus dem Tante-Emma-Laden.</p>
        </div>
        <div className="stats">
          <div className="stat"><div className="n">{items.reduce((s,i) => s + i.qty, 0)}</div><div className="l">Stück</div></div>
          <div className="stat"><div className="n">{groups.length}</div><div className="l">Läden</div></div>
          <div className="stat"><div className="n">{fmt(saved)}</div><div className="l">Gespart</div></div>
        </div>
      </div>

      <div className="shop-layout">
        <div className="ledger">
          <div className="ledger-head">
            <span>買物帳 · LEDGER</span>
            <span className="mono" style={{ fontSize: 11, letterSpacing: "0.15em" }}>Nr. 00{items.length}</span>
          </div>
          <div className="ledger-body">
            {items.length === 0 ? (
              <div className="empty-drawer">
                <EmptyBasket size={84} />
                <p>Der Korb ist noch leer.<br/>Stöbern Sie durch die Angebote und sammeln Sie Ihre Schätze.</p>
              </div>
            ) : groups.map(g => (
              <React.Fragment key={g.r.id}>
                <div className={"group-head " + g.r.color}>
                  <span>{g.r.name} · {g.r.jp}</span>
                  <span>{g.items.length} Pos.</span>
                </div>
                {g.items.map(it => (
                  <div key={it.id} className="list-row">
                    <span className={"check" + (it.done ? " on" : "")} onClick={() => toggleDone(it.id)} />
                    <span className={"name" + (it.done ? " done" : "")}>
                      {it.title}
                      <small>{it.unit} · gültig {it.valid}</small>
                    </span>
                    <span className="qty" onClick={() => setQty(it.id, it.qty + 1)} style={{ cursor: "pointer" }}>× {it.qty}</span>
                    <span className="price">{fmt(it.price * it.qty)}</span>
                    <button className="rm" onClick={() => removeItem(it.id)}>✕</button>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        <aside className="summary-panel">
          <h3>Zusammenfassung 勘定</h3>
          <div className="summary-row"><span>Positionen</span><span className="v">{items.length}</span></div>
          <div className="summary-row"><span>Stückzahl</span><span className="v">{items.reduce((s,i) => s + i.qty, 0)}</span></div>
          <div className="summary-row"><span>Originalpreis</span><span className="v">{fmt(wasTotal)}</span></div>
          <div className="summary-row"><span>Aktionspreis</span><span className="v">{fmt(total)}</span></div>
          <div className="total-row">
            <span className="label">TOTAL 合計</span>
            <span className="sum">{fmt(total)}</span>
          </div>
          {saved > 0 && (
            <div className="savings-hanko">
              <div>
                <div className="w">{fmt(saved)}</div>
                <div className="l">GESPART 節約</div>
              </div>
            </div>
          )}
          <div className="export-row" style={{ marginTop: 18 }}>
            <button className="stamp-btn"><span className="jp">複写</span>Kopieren</button>
            <button className="stamp-btn"><span className="jp">出力</span>CSV</button>
            <button className="stamp-btn"><span className="jp">共有</span>Teilen</button>
          </div>
        </aside>
      </div>
    </section>
  );
}

Object.assign(window, { HomePage, OffersPage, ProspektePage, ShoppingListPage });
