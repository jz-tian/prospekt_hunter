import { AddToListButton } from "@/components/add-to-list-button";
import { formatDateRange, formatEuro } from "@/lib/format";

export function OfferCard({ offer }) {
  const dataStatus = offer.sourceType === "fixture" ? "Beispieldaten" : null;
  const displayPrice = offer.priceLabel || formatEuro(offer.salePrice);
  const canAddToList = !(offer.offerKind === "coupon" && offer.priceLabel);

  return (
    <article className="card offer-card">
      {offer.imageUrl ? (
        <div className="offer-image-wrap">
          <img className="offer-image" src={offer.imageUrl} alt={offer.productName} loading="lazy" />
        </div>
      ) : null}
      <div className="offer-top">
        <span className="retailer-pill">{offer.retailerName}</span>
        {dataStatus ? <span className="muted">{dataStatus}</span> : null}
      </div>
      <h4>{offer.productName}</h4>
      <div className="meta offer-meta">
        {offer.brand ? `${offer.brand} · ` : ""}
        {offer.unitInfo || "Aktionsartikel"}
      </div>
      <div className="price-row">
        <span className="sale-price">{displayPrice}</span>
        {offer.originalPrice ? <span className="original-price">{formatEuro(offer.originalPrice)}</span> : null}
      </div>
      <div className="offer-footer">
        <div className="muted">Gültig {formatDateRange(offer.validFrom, offer.validTo)}</div>
        {canAddToList ? <AddToListButton offerId={offer.id} /> : null}
      </div>
    </article>
  );
}
