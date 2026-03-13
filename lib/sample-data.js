export const SAMPLE_FIXTURES = {
  aldi: {
    current: {
      issue: {
        title: "ALDI Wochenangebote",
        validFrom: "2026-03-09",
        validTo: "2026-03-15",
        sourceUrl: "https://www.aldi-sued.de/de/angebote/prospekte.html",
        assetPath: "fixtures/aldi-prospekt-current.pdf",
        sourceType: "fixture",
        weekScope: "current"
      },
      offers: [
        { productName: "Bio Avocado Hass", brand: "NATURGUT", salePrice: 0.99, unitInfo: "Stück", sourceSection: "Obst & Gemüse", confidenceScore: 0.97 },
        { productName: "Frische Hähnchen-Minutensteaks", brand: "MEINE METZGEREI", salePrice: 3.99, unitInfo: "400 g", sourceSection: "Fleisch", confidenceScore: 0.94 },
        { productName: "Choceur Tafelschokolade", brand: "Choceur", salePrice: 0.79, unitInfo: "100 g", sourceSection: "Süßes", confidenceScore: 0.91 }
      ]
    },
    next: {
      issue: {
        title: "ALDI Vorschau nächste Woche",
        validFrom: "2026-03-16",
        validTo: "2026-03-22",
        sourceUrl: "https://www.aldi-sued.de/de/angebote/prospekte.html",
        assetPath: "fixtures/aldi-prospekt-next.pdf",
        sourceType: "fixture",
        weekScope: "next"
      },
      offers: [
        { productName: "Rispentomaten", brand: "NATURGUT", salePrice: 1.79, unitInfo: "1 kg", sourceSection: "Obst & Gemüse", confidenceScore: 0.94 },
        { productName: "Puten-Schnitzel natur", brand: "MEINE METZGEREI", salePrice: 4.29, unitInfo: "500 g", sourceSection: "Fleisch", confidenceScore: 0.9 }
      ]
    }
  },
  lidl: {
    current: {
      issue: {
        title: "Lidl Prospekt der Woche",
        validFrom: "2026-03-09",
        validTo: "2026-03-14",
        sourceUrl: "https://www.lidl.de/c/prospekte/s10005474",
        assetPath: "fixtures/lidl-prospekt-current.pdf",
        sourceType: "fixture",
        weekScope: "current"
      },
      offers: [
        { productName: "Italienische Mini Romatomaten", brand: "Lidl", salePrice: 1.49, unitInfo: "500 g", sourceSection: "Obst & Gemüse", confidenceScore: 0.96 },
        { productName: "Milbona Griechischer Joghurt", brand: "Milbona", salePrice: 1.11, unitInfo: "1 kg", sourceSection: "Molkerei", confidenceScore: 0.88 },
        { productName: "Formil Color Waschmittel", brand: "Formil", salePrice: 5.55, unitInfo: "40 WL", sourceSection: "Haushalt", confidenceScore: 0.93 }
      ]
    },
    next: {
      issue: {
        title: "Lidl Vorschau nächste Woche",
        validFrom: "2026-03-16",
        validTo: "2026-03-21",
        sourceUrl: "https://www.lidl.de/c/prospekte/s10005474",
        assetPath: "fixtures/lidl-prospekt-next.pdf",
        sourceType: "fixture",
        weekScope: "next"
      },
      offers: [
        { productName: "Deluxe Lachsfilet", brand: "Lidl Deluxe", salePrice: 4.99, unitInfo: "250 g", sourceSection: "Fisch", confidenceScore: 0.93 },
        { productName: "Milbona Butter", brand: "Milbona", salePrice: 1.79, unitInfo: "250 g", sourceSection: "Molkerei", confidenceScore: 0.91 }
      ]
    }
  },
  denns: {},
  norma: {},
  edeka: {
    current: {
      issue: {
        title: "EDEKA Angebote der Woche",
        validFrom: "2026-03-07",
        validTo: "2026-03-14",
        sourceUrl: "https://www.edeka.de/markt-id/10003350/prospekt.jsp",
        assetPath: "fixtures/edeka-prospekt-current.pdf",
        sourceType: "fixture",
        weekScope: "current"
      },
      offers: [
        { productName: "Mumm Jahrgangssekt", brand: "Mumm", salePrice: 3.99, unitInfo: "0,75 l", sourceSection: "Getränke & Genussmittel", confidenceScore: 0.92 },
        { productName: "GUT & GÜNSTIG Gouda jung", brand: "GUT & GÜNSTIG", salePrice: 1.79, unitInfo: "400 g", sourceSection: "Käse", confidenceScore: 0.94 },
        { productName: "ja! Küchenrolle 4x45 Blatt", brand: "ja!", salePrice: 2.29, unitInfo: "4 Rollen", sourceSection: "Haushalt", confidenceScore: 0.89 }
      ]
    }
  }
};

export function getFixtureForWeek(retailerSlug, weekScope = "current") {
  return SAMPLE_FIXTURES[retailerSlug]?.[weekScope] ?? null;
}
