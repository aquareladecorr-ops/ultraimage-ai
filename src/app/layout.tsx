import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: "UltraImage AI — Suas fotos, em sua melhor versão",
    template: "%s · UltraImage AI",
  },
  description: "Ampliação de imagens com IA premium. Resolução até 100 megapixels, em segundos, com qualidade que sustenta impressão grande. Processamento gratuito nesta fase, com suporte em português.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ultraimageai.com"),
  manifest: "/manifest.json",
  themeColor: "#0a0a0a",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: "/favicon.svg",
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "UltraImage AI" },
  openGraph: { type: "website", locale: "pt_BR", siteName: "UltraImage AI" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/* Google Ads Tag - AW-18172780228 */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=AW-18172780228" strategy="afterInteractive" />
        <Script id="google-ads-tag" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-18172780228');
        `}</Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..900,0..100&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
