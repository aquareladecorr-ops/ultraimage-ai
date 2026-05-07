/**
 *  * Package definitions -- kept in sync with `packages` table in DB.
  * The DB is source of truth at runtime; this file is for type safety
   * and for static rendering on landing/marketing pages.
    *
     * PRICING METHODOLOGY (updated 2026-05):
      *   Cost per credit (Replicate crystal-upscaler, ~12MP->48MP output):
       *     USD 0.80/image * BRL 4.94/USD = ~BRL 3.95/credit (typical portrait)
        *   Payment gateway fee (Mercado Pago avg): ~4.5%
         *   Target net margin: 20%
          *   Formula: fullPrice = costPerCredit * credits / (1 - 0.20 - 0.045)
           *
            *   launchPrice = fullPrice * 0.80  (20% launch discount, shown as "por")
             *   fullPrice shown as "de" (crossed out) for social proof
              */

              export type PackageKind = "one_time" | "subscription";

              export type Package = {
                id: string;
                  name: string;
                    description: string;
                      kind: PackageKind;
                        credits: number;
                          priceBrl: number;
                            fullPriceBrl?: number;
                              isLaunchPromo?: boolean;
                                isFeatured: boolean;
                                };

                                export const ONE_TIME_PACKAGES: readonly Package[] = [
                                  {
                                      id: "avulso",
                                          name: "Avulso",
                                              description: "Para experimentar",
                                                  kind: "one_time",
                                                      credits: 5,
                                                          priceBrl: 21.90,
                                                              fullPriceBrl: 26.90,
                                                                  isLaunchPromo: true,
                                                                      isFeatured: false,
                                                                        },
                                                                          {
                                                                              id: "iniciante",
                                                                                  name: "Iniciante",
                                                                                      description: "Boa primeira compra",
                                                                                          kind: "one_time",
                                                                                              credits: 25,
                                                                                                  priceBrl: 104.90,
                                                                                                      fullPriceBrl: 129.90,
                                                                                                          isLaunchPromo: true,
                                                                                                              isFeatured: false,
                                                                                                                },
                                                                                                                  {
                                                                                                                      id: "essencial",
                                                                                                                          name: "Essencial",
                                                                                                                              description: "O preferido",
                                                                                                                                  kind: "one_time",
                                                                                                                                      credits: 80,
                                                                                                                                          priceBrl: 335.00,
                                                                                                                                              fullPriceBrl: 419.00,
                                                                                                                                                  isLaunchPromo: true,
                                                                                                                                                      isFeatured: true,
                                                                                                                                                        },
                                                                                                                                                          {
                                                                                                                                                              id: "profissional",
                                                                                                                                                                  name: "Profissional",
                                                                                                                                                                      description: "Para fotografos",
                                                                                                                                                                          kind: "one_time",
                                                                                                                                                                              credits: 250,
                                                                                                                                                                                  priceBrl: 1032.00,
                                                                                                                                                                                      fullPriceBrl: 1290.00,
                                                                                                                                                                                          isLaunchPromo: true,
                                                                                                                                                                                              isFeatured: false,
                                                                                                                                                                                                },
                                                                                                                                                                                                  {
                                                                                                                                                                                                      id: "estudio",
                                                                                                                                                                                                          name: "Estudio",
                                                                                                                                                                                                              description: "Volume alto",
                                                                                                                                                                                                                  kind: "one_time",
                                                                                                                                                                                                                      credits: 800,
                                                                                                                                                                                                                          priceBrl: 3352.00,
                                                                                                                                                                                                                              fullPriceBrl: 4190.00,
                                                                                                                                                                                                                                  isLaunchPromo: true,
                                                                                                                                                                                                                                      isFeatured: false,
                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                        ] as const;

                                                                                                                                                                                                                                        export const SUBSCRIPTION_PACKAGES: readonly Package[] = [
                                                                                                                                                                                                                                          {
                                                                                                                                                                                                                                              id: "plan_light",
                                                                                                                                                                                                                                                  name: "Light",
                                                                                                                                                                                                                                                      description: "Uso leve, sempre pronto",
                                                                                                                                                                                                                                                          kind: "subscription",
                                                                                                                                                                                                                                                              credits: 30,
                                                                                                                                                                                                                                                                  priceBrl: 99.90,
                                                                                                                                                                                                                                                                      fullPriceBrl: 124.90,
                                                                                                                                                                                                                                                                          isLaunchPromo: true,
                                                                                                                                                                                                                                                                              isFeatured: false,
                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                  {
                                                                                                                                                                                                                                                                                      id: "plan_pro",
                                                                                                                                                                                                                                                                                          name: "Pro",
                                                                                                                                                                                                                                                                                              description: "O equilibrio ideal",
                                                                                                                                                                                                                                                                                                  kind: "subscription",
                                                                                                                                                                                                                                                                                                      credits: 100,
                                                                                                                                                                                                                                                                                                          priceBrl: 259.00,
                                                                                                                                                                                                                                                                                                              fullPriceBrl: 319.00,
                                                                                                                                                                                                                                                                                                                  isLaunchPromo: true,
                                                                                                                                                                                                                                                                                                                      isFeatured: true,
                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                          {
                                                                                                                                                                                                                                                                                                                              id: "plan_business",
                                                                                                                                                                                                                                                                                                                                  name: "Business",
                                                                                                                                                                                                                                                                                                                                      description: "Equipes e graficas",
                                                                                                                                                                                                                                                                                                                                          kind: "subscription",
                                                                                                                                                                                                                                                                                                                                              credits: 400,
                                                                                                                                                                                                                                                                                                                                                  priceBrl: 899.00,
                                                                                                                                                                                                                                                                                                                                                      fullPriceBrl: 1119.00,
                                                                                                                                                                                                                                                                                                                                                          isLaunchPromo: true,
                                                                                                                                                                                                                                                                                                                                                              isFeatured: false,
                                                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                                                ] as const;

                                                                                                                                                                                                                                                                                                                                                                export const ALL_PACKAGES = [...ONE_TIME_PACKAGES, ...SUBSCRIPTION_PACKAGES];

                                                                                                                                                                                                                                                                                                                                                                export function getPackageById(id: string): Package | undefined {
                                                                                                                                                                                                                                                                                                                                                                  return ALL_PACKAGES.find((p) => p.id === id);
                                                                                                                                                                                                                                                                                                                                                                  }

                                                                                                                                                                                                                                                                                                                                                                  export function formatBrl(value: number): string {
                                                                                                                                                                                                                                                                                                                                                                    return new Intl.NumberFormat("pt-BR", {
                                                                                                                                                                                                                                                                                                                                                                        style: "currency",
                                                                                                                                                                                                                                                                                                                                                                            currency: "BRL",
                                                                                                                                                                                                                                                                                                                                                                              }).format(value);
                                                                                                                                                                                                                                                                                                                                                                              }
 */