// Global shell: news strip + fascia header with nav + footer

function NewsStrip() {
  const items = [
    "KW 17 · Angebote aktiv",
    "Letztes Update 20.04. 06:14",
    "5 Händler · 678 Angebote",
    "Demo-Modus · Daten zu Anschauungszwecken"
  ];
  return (
    <div className="news-strip">
      <div className="shell">
        <span className="motif">◆ ━━━ 特報 ━━━ ◆</span>
        <span>{items[0]} <span className="dot" /> {items[1]} <span className="dot" /> {items[2]}</span>
        <span>{items[3]}</span>
        <span className="motif">◆ ━━━ 速報 ━━━ ◆</span>
      </div>
    </div>
  );
}

function Fascia({ page, setPage, cartCount, openDrawer }) {
  const links = [
    { id: "home",     label: "Markt",       jp: "市場" },
    { id: "offers",   label: "Angebote",    jp: "特売" },
    { id: "prospekte",label: "Prospekte",   jp: "広告" },
    { id: "list",     label: "Einkaufsliste", jp: "買物" }
  ];
  return (
    <header className="fascia">
      <div className="shell fascia-inner">
        <div className="logo-block">
          <a className="logo-frame" onClick={() => setPage("home")} style={{ cursor: "pointer", textDecoration: "none" }}>
            <span className="jp-sub">ラバット ハンター</span>
            <span className="wordmark">Rabatt<em>Hunter</em></span>
          </a>
          <div className="hanko">昭<small>和</small></div>
        </div>
        <nav className="nav">
          {links.map(l => (
            <a key={l.id} className={page === l.id ? "on" : ""} onClick={() => setPage(l.id)}>
              <span className="jp-hint">{l.jp}</span>
              {l.label}
            </a>
          ))}
        </nav>
        <button className="basket-btn" onClick={openDrawer}>
          <BasketIcon />
          <span>Korb</span>
          <span className="count">{cartCount}</span>
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <div className="shell">
        <span className="motif">◇ ━ 商店街 ━ ◇</span>
        <span>RABATTHUNTER · WOCHEN-ANGEBOTE · BRD · SHŌWA-AUSGABE</span>
        <span>© 2026 · NICHT MIT DEN HÄNDLERN VERBUNDEN · v3.14</span>
      </div>
    </footer>
  );
}

function Signboard({ jp, title, sub }) {
  return (
    <div className="signboard">
      <div className="rule" />
      <div className="title-frame">
        {jp && <span className="jp">{jp}</span>}
        <h2>{title}</h2>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <div className="rule" />
    </div>
  );
}

function WeekSwitch({ week, setWeek }) {
  return (
    <div className="noren-switch" role="tablist">
      <button className={"noren-tab" + (week === "current" ? " on" : "")} onClick={() => setWeek("current")}>
        <span className="slit" />
        <span className="jp-mini">今週</span>
        <span className="lbl">Diese Woche</span>
        <span className="dates">KW 17 · 20.–25.04.</span>
      </button>
      <button className={"noren-tab" + (week === "next" ? " on" : "")} onClick={() => setWeek("next")}>
        <span className="slit" />
        <span className="jp-mini">来週</span>
        <span className="lbl">Nächste Woche</span>
        <span className="dates">KW 18 · 27.04.–02.05.</span>
      </button>
    </div>
  );
}

Object.assign(window, { NewsStrip, Fascia, Footer, Signboard, WeekSwitch });
