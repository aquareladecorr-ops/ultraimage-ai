import { NextResponse } from "next/server";
import { createAdminClient, createServer } from "@/lib/supabase/server";

export async function GET() {
  const admin = createAdminClient();
  const userClient = createServer();

  // Get Supabase session user
  const { data: auth } = await userClient.auth.getUser();
  const supabaseUser = auth?.user
    ? { id: auth.user.id, email: auth.user.email }
    : null;

  // Get profile data using admin (bypasses RLS)
  let profile = null;
  if (auth?.user) {
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", auth.user.id)
      .single();
    profile = { data, error: error?.message };
  }

  // Get MP user
  let mpUser = null;
  try {
    const res = await fetch("https://api.mercadopago.com/users/me", {
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    });
    mpUser = await res.json();
  } catch (e) {
    mpUser = { error: String(e) };
  }

  return NextResponse.json({ supabaseUser, profile, mpUser });
}
