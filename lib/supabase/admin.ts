import { createClient } from "@supabase/supabase-js";

import { appEnv } from "@/lib/env";

export function createAdminClient() {
  if (!appEnv.supabaseUrl || !appEnv.supabaseServiceRoleKey) {
    return null;
  }

  return createClient(appEnv.supabaseUrl, appEnv.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
