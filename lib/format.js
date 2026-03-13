export function formatEuro(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export function formatDateRange(validFrom, validTo) {
  const format = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit"
  });

  return `${format.format(new Date(validFrom))} - ${format.format(new Date(validTo))}`;
}
