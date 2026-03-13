import { Inter } from "next/font/google";
import "./globals.css";

// Use `variable` (not `className`) so the font is exposed as a CSS custom property
// --font-inter, which globals.css references via var(--font-inter).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "RabattHunter",
  description: "Wöchentliche Prospekt-Angebote von ALDI, Lidl, Denns BioMarkt, NORMA und EDEKA — kategorisiert, gefiltert, auf einen Blick."
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={inter.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
