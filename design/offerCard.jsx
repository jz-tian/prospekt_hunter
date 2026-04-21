// Offer card + stall card

function StallCard({ retailer, stat }) {
  return (
    <div className={"stall " + retailer.color}>
      <div className="noren">{retailer.jp}</div>
      <div className="body">
        <div className="name">
          <span className="jp">{retailer.motto}</span>
          {retailer.name}
        </div>
        <div className="count">
          {stat.offers}<span className="unit">件<br/>ANGEB.</span>
        </div>
        <div className="validity">
          <span>{stat.valid}</span>
          <span className="cta">Zum Prospekt →</span>
        </div>
      </div>
    </div>
  );
}

function DiscountStamp({ pct }) {
  return (
    <div className="discount-stamp" aria-label={`Rabatt ${pct} Prozent`}>
      <div>
        −{pct}%
        <small>SPAR</small>
      </div>
    </div>
  );
}

function OfferCard({ offer, retailer, inCart, onAdd }) {
  const [flash, setFlash] = React.useState(false);
  const handleAdd = () => {
    setFlash(true);
    onAdd(offer);
    setTimeout(() => setFlash(false), 520);
  };
  const fmt = n => n.toFixed(2).replace(".", ",") + " €";
  const catLabel = (window.CATEGORIES.find(c => c.id === offer.cat) || {}).label || "";
  return (
    <article className="offer">
      {offer.tags.includes("neu") && <span className="ribbon-new">NEU 新</span>}
      {offer.tags.includes("tipp") && !offer.tags.includes("neu") && <span className="ribbon-new" style={{ background: "var(--sage)", color: "var(--bg)" }}>TIPP 推</span>}
      <DiscountStamp pct={offer.discount} />
      <div className="image-frame">
        <div className="ph">
          <span>{offer.title.split(" ")[0].toUpperCase()}<br/>商品写真</span>
        </div>
        <div className="retailer-tape">
          <span>{retailer.name}</span>
          <span className="cat">{catLabel}</span>
        </div>
      </div>
      <div className="title">{offer.title}</div>
      <div className="unit">{offer.unit}</div>
      <div className="price-row">
        <span className="now">{fmt(offer.price)}</span>
        <span className="was">statt {fmt(offer.was)}</span>
      </div>
      <div className="bottom">
        <span className="validity">gültig {offer.valid}</span>
        <button
          className={"add-stamp" + (inCart ? " added" : "") + (flash ? " flash" : "")}
          onClick={handleAdd}
          aria-label={inCart ? "Im Korb" : "Zum Korb hinzufügen"}
        >
          {inCart ? "✓" : "＋"}
        </button>
      </div>
    </article>
  );
}

Object.assign(window, { StallCard, DiscountStamp, OfferCard });
