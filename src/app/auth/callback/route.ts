import { createServer, createAdminClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
    const code = url.searchParams.get("code");
      const next = url.searchParams.get("next") ?? "/dashboard";

        if (code) {
            const supabase = createServer();
                const { data } = await supabase.auth.exchangeCodeForSession(code);

                    // Anti-abuse: registrar IP e verificar limite por IP nos primeiros 60s apos criacao
                        if (data?.user) {
                              const userId = data.user.id;
                                    const isNewUser =
                                            data.user.created_at &&
                                                    Math.abs(Date.now() - new Date(data.user.created_at).getTime()) < 60_000;

                                                          if (isNewUser) {
                                                                  const ip =
                                                                            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
                                                                                      request.headers.get("x-real-ip") ??
                                                                                                "unknown";

                                                                                                        try {
                                                                                                                  const admin = createAdminClient();

                                                                                                                            // Salvar IP no perfil
                                                                                                                                      await admin
                                                                                                                                                  .from("profiles")
                                                                                                                                                              .update({ signup_ip: ip })
                                                                                                                                                                          .eq("id", userId);

                                                                                                                                                                                    if (ip !== "unknown") {
                                                                                                                                                                                                // Contar contas com creditos concedidos neste IP nos ultimos 60 dias
                                                                                                                                                                                                            const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
                                                                                                                                                                                                                        const { count } = await admin
                                                                                                                                                                                                                                      .from("profiles")
                                                                                                                                                                                                                                                    .select("id", { count: "exact", head: true })
                                                                                                                                                                                                                                                                  .eq("signup_ip", ip)
                                                                                                                                                                                                                                                                                .eq("welcome_credits_granted", true)
                                                                                                                                                                                                                                                                                              .neq("id", userId)
                                                                                                                                                                                                                                                                                                            .gte("created_at", since);

                                                                                                                                                                                                                                                                                                                        // IP duplicado: revogar creditos via stored procedure atomica
                                                                                                                                                                                                                                                                                                                                    if ((count ?? 0) >= 1) {
                                                                                                                                                                                                                                                                                                                                                  await admin.rpc("revoke_welcome_credits", { p_user_id: userId });
                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                                                                } catch {
                                                                                                                                                                                                                                                                                                                                                                                          // Falha silenciosa: nao bloquear o login por erro interno de anti-abuso
                                                                                                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                                                                                                                                                                return NextResponse.redirect(new URL(next, url.origin));
                                                                                                                                                                                                                                                                                                                                                                                                                }