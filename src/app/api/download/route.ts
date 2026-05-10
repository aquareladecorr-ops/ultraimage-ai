// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createServer, createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
    const supabase = createServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    if (!jobId) {
          return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

  const admin = createAdminClient();
    const { data: job } = await admin
      .from("image_jobs")
      .select("result_url, original_filename, status")
      .eq("id", jobId)
      .eq("user_id", auth.user.id)
      .single();

  if (!job || job.status !== "completed" || !job.result_url) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const baseName = job.original_filename
      ? job.original_filename.replace(/\.[^.]+$/, "")
        : "ultraimage";
    const filename = baseName + "_ultra.jpg";

  // Gera URL assinada com download forcado — o Supabase adiciona
  // Content-Disposition: attachment; filename="..." automaticamente
  const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
      );

  const { data, error } = await adminSupabase.storage
      .from("images")
      .createSignedUrl(job.result_url, 60, {
              download: filename,
      });

  if (error || !data) {
        return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }

  // Redireciona para a URL assinada com Content-Disposition correto
  return NextResponse.redirect(data.signedUrl, 302);
}
