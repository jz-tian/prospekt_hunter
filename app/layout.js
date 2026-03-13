import "./globals.css";

export const metadata = {
  title: "AngebotsRadar",
  description: "Wöchentliche Prospekt-Angebote von Aldi, Lidl, REWE und EDEKA an einem Ort."
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
