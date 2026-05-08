import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
      default: "UltraImage AI \u2014 Suas fotos, em sua melhor vers\u00e3o",
          template: "%s \u00b7 UltraImage AI",
            },
              description:
                  "Amplia\u00e7\u00e3o de imagens com IA premium. Resolu\u00e7\u00e3o at\u00e9 100 megapixels, em segundos, com qualidade que sustenta impress\u00e3o grande. Pagamento em real, suporte em portugu\u00eas.",
                    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ultraimageai.com"),
                      manifest: "/manifest.json",
                        themeColor: "#0a0a0a",
                          appleWebApp: {
                              capable: true,
                                  statusBarStyle: "black-translucent",
                                      title: "UltraImage AI",
                                        },
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
                                                                                                      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..900,0..100&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500"
                                                                                                                rel="stylesheet"
                                                                                                                        />
                                                                                                                              </head>
                                                                                                                                    <body>{children}</body>
                                                                                                                                        </html>
                                                                                                                                          );
                                                                                                                                          }