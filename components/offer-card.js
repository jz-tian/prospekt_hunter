import { AddToListButton } from "@/components/add-to-list-button";
import { formatDateRange, formatEuro } from "@/lib/format";

export function OfferCard({ offer }) {
  return (
    <article className="card offer-card">
      {offer.imageUrl ? (
        <div className="offer-image-wrap">
          <img className="offer-image" src={offer.imageUrl} alt={offer.productName} loading="lazy" />
        </div>
      ) : null}
      <div className="offer-top">
        <span className="retailer-pill">{offer.retailerName}</span>
      </div>
      <h4>{offer.productName}</h4>
      <div className="meta offer-meta">
        {offer.brand ? `${offer.brand} · ` : ""}
        {offer.unitInfo || "Aktionsartikel"}
      </div>
      <div className="price-row">
        <span className="sale-price">{formatEuro(offer.salePrice)}</span>
      </div>
      <div className="offer-footer">
        <div className="muted">Gültig {formatDateRange(offer.validFrom, offer.validTo)}</div>
        <AddToListButton offerId={offer.id} />
      </div>
    </article>
  );
}
