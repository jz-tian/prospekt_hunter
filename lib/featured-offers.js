function getDiscountPercent(offer) {
  if (!offer.originalPrice || offer.originalPrice <= offer.salePrice) {
    return 0;
  }

  return ((offer.originalPrice - offer.salePrice) / offer.originalPrice) * 100;
}

function scoreOffer(offer) {
  const discountPercent = getDiscountPercent(offer);
  const affordabilityScore =
    offer.salePrice <= 1 ? 28 :
    offer.salePrice <= 2 ? 22 :
    offer.salePrice <= 5 ? 16 :
    offer.salePrice <= 10 ? 10 :
    offer.salePrice <= 25 ? 5 : 0;
  const mediaScore = offer.imageUrl ? 4 : 0;
  const linkScore = offer.productUrl ? 2 : 0;
  const confidenceScore = Math.round((offer.confidenceScore ?? 0.5) * 10);

  return (discountPercent * 1.4) + affordabilityScore + mediaScore + linkScore + confidenceScore;
}

export function selectFeaturedOffers(candidates, limit = 6) {
  const sorted = [...candidates]
    .filter((offer) => offer.offerKind !== "coupon")
    .map((offer) => ({
      ...offer,
      discountPercent: getDiscountPercent(offer),
      featuredScore: scoreOffer(offer)
    }))
    .sort((left, right) => {
      if (right.featuredScore !== left.featuredScore) {
        return right.featuredScore - left.featuredScore;
      }

      if (right.discountPercent !== left.discountPercent) {
        return right.discountPercent - left.discountPercent;
      }

      if (left.salePrice !== right.salePrice) {
        return left.salePrice - right.salePrice;
      }

      return left.productName.localeCompare(right.productName, "de");
    });

  const selected = [];
  const retailerCounts = new Map();
  const categoryCounts = new Map();

  for (const offer of sorted) {
    if (selected.length >= limit) {
      break;
    }

    const retailerCount = retailerCounts.get(offer.retailerSlug) ?? 0;
    const categoryCount = categoryCounts.get(offer.categorySlug) ?? 0;

    if (retailerCount >= 2) {
      continue;
    }

    if (selected.length < 4 && categoryCount >= 1) {
      continue;
    }

    selected.push(offer);
    retailerCounts.set(offer.retailerSlug, retailerCount + 1);
    categoryCounts.set(offer.categorySlug, categoryCount + 1);
  }

  for (const offer of sorted) {
    if (selected.length >= limit) {
      break;
    }

    if (selected.some((entry) => entry.id === offer.id)) {
      continue;
    }

    const retailerCount = retailerCounts.get(offer.retailerSlug) ?? 0;
    if (retailerCount >= 2) {
      continue;
    }

    selected.push(offer);
    retailerCounts.set(offer.retailerSlug, retailerCount + 1);
  }

  return selected.slice(0, limit);
}
