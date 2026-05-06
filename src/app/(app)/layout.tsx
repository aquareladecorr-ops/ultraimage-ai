import { createServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/app/sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_available, full_name, email, is_admin")
    .eq("id", auth.user.id)
    .single();

  return (
    <div className="min-h-screen bg-ink text-bone">
      <header className="border-b border-ink-line backdrop-blur-md bg-ink/80 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 relative">
              <div className="absolute inset-0 rounded-sm border border-copper rotate-45" />
              <div className="absolute inset-1 bg-copper rotate-45" />
            </div>
            <span className="font-display tracking-tight" style={{ fontWeight: 500, fontSize: "18px" }}>
              ultraimage<span className="text-copper">.</span>ai
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-bone-dim">
            <Link href="/dashboard" className="hover:text-bone transition">Painel</Link>
            <Link href="/upload" className="hover:text-bone transition">Processar</Link>
            <Link href="/credits" className="hover:text-bone transition">Créditos</Link>
            {profile?.is_admin && (
              <Link href="/admin" className="hover:text-copper transition">Admin</Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/credits"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-ink-line hover:border-copper transition text-sm font-mono"
            >
              <span className="text-copper">✦</span>
              <span>{profile?.credits_available ?? 0}</span>
              <span className="text-bone-dim">créditos</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
