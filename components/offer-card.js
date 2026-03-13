import { AddToListButton } from "@/components/add-to-list-button";
import { formatDateRange, formatEuro } from "@/lib/format";

export function OfferCard({ offer }) {
  const displayPrice = offer.priceLabel || formatEuro(offer.salePrice);
  const canAddToList = !(offer.offerKind === "coupon" && offer.priceLabel);

  const discountPercent =
    offer.originalPrice && offer.salePrice
      ? Math.round((1 - offer.salePrice / offer.originalPrice) * 100)
      : null;

  return (
    <article className="card offer-card">
      <div className="offer-image-wrap">
        {offer.imageUrl ? (
          <img className="offer-image" src={offer.imageUrl} alt={offer.productName} loading="lazy" />
        ) : (
          <div className="offer-image-placeholder" aria-hidden="true" />
        )}
        {discountPercent !== null && (
          <span className="discount-badge">−{discountPercent}%</span>
        )}
      </div>

      <div className="offer-body">
        <span className="retailer-pill">{offer.retailerName}</span>
        <h4 className="offer-title">{offer.productName}</h4>
        <p className="offer-meta">{offer.brand ? `${offer.brand} · ` : ""}{offer.unitInfo || "Aktionsartikel"}</p>

        <div className="price-row">
          <span className="sale-price">{displayPrice}</span>
          {offer.originalPrice ? (
            <span className="original-price">{formatEuro(offer.originalPrice)}</span>
          ) : null}
        </div>

        <div className="offer-footer">
          <span className="muted offer-date">Gültig {formatDateRange(offer.validFrom, offer.validTo)}</span>
          {canAddToList ? <AddToListButton offerId={offer.id} /> : null}
        </div>
      </div>
    </article>
  );
}
