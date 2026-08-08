import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AuthenticatedViewer = {
  profile: Tables<"profiles"> | null;
  userId: string;
};

export async function getAuthenticatedViewer(): Promise<AuthenticatedViewer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return { profile, userId };
}
