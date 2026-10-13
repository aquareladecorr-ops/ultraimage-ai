import { createServer } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/safe-next-path";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
    const code = url.searchParams.get("code");
        const next = safeNextPath(url.searchParams.get("next"));

        if (code) {
            const supabase = await createServer();
                await supabase.auth.exchangeCodeForSession(code);
                  }

                    return NextResponse.redirect(new URL(next, url.origin));
                    }
