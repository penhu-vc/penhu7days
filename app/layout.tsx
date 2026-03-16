import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://penhu.xyz"),
  title: "Penhu 交易聯盟 - 新手七天陪跑課",
  description: "Penhu 交易聯盟的新手入門課程，七天帶你入門加密貨幣交易",
  openGraph: {
    title: "Penhu 交易聯盟 - 新手七天陪跑課",
    description: "Penhu 交易聯盟的新手入門課程，七天帶你入門加密貨幣交易",
    url: "https://penhu.xyz",
    siteName: "Penhu 交易聯盟",
    type: "website",
    images: [
      { url: "/icon-512.png?v=20260225h1", width: 512, height: 512, alt: "Penhu H Logo" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Penhu 交易聯盟 - 新手七天陪跑課",
    description: "Penhu 交易聯盟的新手入門課程，七天帶你入門加密貨幣交易",
    images: ["/icon-512.png?v=20260225h1"],
  },
  icons: {
    icon: [
      { url: "/favicon-64.png?v=20260225h1", sizes: "64x64", type: "image/png" },
      { url: "/favicon-32.png?v=20260225h1", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png?v=20260225h1", sizes: "16x16", type: "image/png" },
    ],
    shortcut: ["/favicon-64.png?v=20260225h1"],
    apple: [{ url: "/apple-touch-icon.png?v=20260225h1", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="preload" href="/fonts/jfjinxuan3-book.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/hero-woman-cutout.webp" as="image" type="image/webp" />
        <link rel="preload" href="/hero-man-cutout.webp" as="image" type="image/webp" />
        <link rel="preload" href="/hero-image.png" as="image" type="image/png" />
        <link rel="preload" href="/hero-image-2.webp" as="image" type="image/webp" />
      </head>
      <body className="antialiased bg-[#0a0a0a]">
        {children}
      </body>
    </html>
  );
}
