import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["400", "500", "600", "700", "800"]
});

export const metadata = {
  title: "RabattHunter · by Jiazheng Tian",
  description: "Live weekly supermarket deals from ALDI, Lidl, Denns, NORMA and EDEKA — scraped, categorised and filterable. A full-stack portfolio project built with Next.js 15, Turso and live retail APIs.",
  authors: [{ name: "Jiazheng Tian" }],
  keywords: ["supermarket", "discounts", "ALDI", "Lidl", "EDEKA", "Next.js", "portfolio"],
  openGraph: {
    title: "RabattHunter · by Jiazheng Tian",
    description: "Live German supermarket discount tracker — Next.js 15, Turso, React 19.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1a5c35",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={`${dmSans.variable} ${bricolage.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
