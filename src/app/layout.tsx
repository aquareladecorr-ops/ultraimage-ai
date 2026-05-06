import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "UltraImage AI — Suas fotos, em sua melhor versão",
    template: "%s · UltraImage AI",
  },
  description:
    "Ampliação de imagens com IA premium. Resolução até 100 megapixels, em segundos, com qualidade que sustenta impressão grande. Pagamento em real, suporte em português.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ultraimageai.com"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "UltraImage AI",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..900,0..100&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
