import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { appEnv, isSupabaseConfigured } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  if (!isSupabaseConfigured) {
    return response;
  }

  const supabase = createServerClient(
    appEnv.supabaseUrl,
    appEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  await supabase.auth.getClaims();

  return response;
}
