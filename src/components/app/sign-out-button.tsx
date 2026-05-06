"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-bone-dim hover:text-bone transition p-1.5"
      aria-label="Sair"
      title="Sair"
    >
      <LogOut size={16} strokeWidth={1.5} />
    </button>
  );
}
