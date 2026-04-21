import "./globals.css";

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
  themeColor: "#7A1A28",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&family=Noto+Sans+JP:wght@400;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Playfair+Display:ital,wght@1,900&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
