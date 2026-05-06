import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient, createServer } from "@/lib/supabase/server";
import { UploadFlow } from "@/components/app/upload-flow";

export default async function UploadPage() {
  noStore();
  const userClient = createServer();
  const admin = createAdminClient();

  const { data: auth } = await userClient.auth.getUser();
  const { data: profile } = await admin
    .from("profiles")
    .select("credits_available")
    .eq("id", auth.user!.id)
    .single();

  return (
    <div className="max-w-[1100px] mx-auto px-6 md:px-10 py-12 md:py-16">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.3em] text-copper mb-3 font-mono">§ Processar</div>
        <h1
          className="font-display leading-[0.95] tracking-editorial"
          style={{ fontWeight: 300, fontSize: "clamp(36px, 5vw, 64px)" }}
        >
          Sua próxima foto, <em className="italic text-copper">em alta resolução</em>.
        </h1>
      </div>
      <UploadFlow availableCredits={profile?.credits_available ?? 0} />
    </div>
  );
}
