import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { appEnv, isSupabaseConfigured } from "@/lib/env";
import { getSafeAuthRedirectPath } from "@/lib/auth-redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeAuthRedirectPath(url.searchParams.get("next"));

  if (!isSupabaseConfigured || !code) {
    return NextResponse.redirect(new URL("/connexion", url.origin));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    appEnv.supabaseUrl,
    appEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );

  await supabase.auth.exchangeCodeForSession(code);

  return NextResponse.redirect(new URL(next, url.origin));
}
