"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export function createClient() {
  const { supabasePublishableKey, supabaseUrl } = getSupabaseConfig();

  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
