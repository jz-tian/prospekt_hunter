// Shopping cart drawer

function Drawer({ open, onClose, cart, removeItem, setQty, toggleDone, goList }) {
  const items = Object.values(cart);
  const groups = window.RETAILERS
    .map(r => ({ r, items: items.filter(it => it.retailerId === r.id) }))
    .filter(g => g.items.length > 0);
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  const saved = items.reduce((s, it) => s + (it.was - it.price) * it.qty, 0);
  const fmt = n => n.toFixed(2).replace(".", ",") + " €";

  return (
    <>
      <div className={"drawer-backdrop" + (open ? " on" : "")} onClick={onClose} />
      <aside className={"drawer" + (open ? " on" : "")} aria-hidden={!open}>
        <div className="drawer-head">
          <div className="t">
            <span className="sub">買 物 籠</span>
            Einkaufsliste
          </div>
          <button className="close" onClick={onClose} aria-label="Schließen">✕</button>
        </div>
        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="empty-drawer">
              <EmptyBasket size={80} />
              <p>Ihr Korb ist leer.<br/>Gehen Sie durch den Markt und sammeln Sie Ihre Funde.</p>
            </div>
          ) : groups.map(g => (
            <React.Fragment key={g.r.id}>
              <div className={"group-head " + g.r.color}>
                <span>{g.r.name}</span>
                <span>{g.items.length} Pos.</span>
              </div>
              {g.items.map(it => (
                <div key={it.id} className="list-row">
                  <span className={"check" + (it.done ? " on" : "")} onClick={() => toggleDone(it.id)} />
                  <span className={"name" + (it.done ? " done" : "")}>
                    {it.title}
                    <small>{it.unit}</small>
                  </span>
                  <span className="qty" onClick={() => setQty(it.id, it.qty + 1)} style={{ cursor: "pointer" }}>× {it.qty}</span>
                  <span className="price">{fmt(it.price * it.qty)}</span>
                  <button className="rm" onClick={() => removeItem(it.id)}>✕</button>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="summary-row"><span>Gespart heute</span><span className="v" style={{ color: "var(--sage)" }}>{fmt(saved)}</span></div>
            <div className="total-row">
              <span className="label">TOTAL 合計</span>
              <span className="sum">{fmt(total)}</span>
            </div>
            <div className="export-row">
              <button className="stamp-btn" onClick={() => { onClose(); goList(); }}><span className="jp">一覧</span>Liste öffnen</button>
              <button className="stamp-btn"><span className="jp">出力</span>CSV</button>
              <button className="stamp-btn"><span className="jp">共有</span>Teilen</button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

Object.assign(window, { Drawer });
