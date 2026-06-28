import type { ReactNode } from "react";
import { PwaProvider } from "@/components/PwaProvider";
import "./globals.css";

export const metadata = {
  title: "Genç Teknoloji | Satış, Stok ve Cari Portalı",
  description: "Genç Teknoloji Bilişim Hizmetleri Dashboard ve Satış Takip Portalı",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Genç Teknoloji"
  },
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.svg", type: "image/svg+xml" }]
  }
};

export const viewport = {
  themeColor: "#060913",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <PwaProvider />
        {children}
      </body>
    </html>
  );
}
