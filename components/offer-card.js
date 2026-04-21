import { AddToListButton } from "@/components/add-to-list-button";
import { formatDateRange, formatEuro } from "@/lib/format";
import { RETAILERS, CATEGORY_DEFINITIONS } from "@/lib/constants";

export function OfferCard({ offer }) {
  const displayPrice = offer.priceLabel || formatEuro(offer.salePrice);
  const canAddToList = !(offer.offerKind === "coupon" && offer.priceLabel);

  const discountPercent =
    offer.originalPrice && offer.salePrice
      ? Math.round((1 - offer.salePrice / offer.originalPrice) * 100)
      : null;

  const categoryDef = CATEGORY_DEFINITIONS.find((c) => c.slug === offer.categorySlug);
  const categoryLabel = categoryDef ? `${categoryDef.emoji} ${categoryDef.name}` : "";

  return (
    <article className="offer">
      {discountPercent !== null && discountPercent > 0 && (
        <div className="discount-stamp" aria-label={`Rabatt ${discountPercent} Prozent`}>
          <div>
            −{discountPercent}%
            <small>SPAR</small>
          </div>
        </div>
      )}

      <div className="image-frame">
        {offer.imageUrl ? (
          <img src={offer.imageUrl} alt={offer.productName} loading="lazy" />
        ) : (
          <div className="ph">
            <span>{offer.productName.split(" ")[0].toUpperCase()}<br />商品写真</span>
          </div>
        )}
        <div className="retailer-tape">
          <span>{offer.retailerName}</span>
          {categoryLabel && <span className="cat">{categoryLabel}</span>}
        </div>
      </div>

      <div className="title">{offer.productName}</div>
      <div className="unit">
        {offer.brand ? `${offer.brand}` : ""}
        {offer.brand && offer.unitInfo ? " · " : ""}
        {offer.unitInfo || "Aktionsartikel"}
      </div>

      <div className="price-row">
        <span className="now">{displayPrice}</span>
        {offer.originalPrice ? (
          <span className="was">statt {formatEuro(offer.originalPrice)}</span>
        ) : null}
      </div>

      <div className="bottom">
        <span className="offer-date">gültig {formatDateRange(offer.validFrom, offer.validTo)}</span>
        {canAddToList ? <AddToListButton offerId={offer.id} /> : null}
      </div>
    </article>
  );
}
