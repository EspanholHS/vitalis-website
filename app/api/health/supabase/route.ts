import { NextResponse } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { supabasePublishableKey, supabaseUrl } = getSupabaseConfig();
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      cache: "no-store",
      headers: { apikey: supabasePublishableKey },
    });

    if (!response.ok) {
      console.error("Supabase health check failed", response.status);
      return NextResponse.json(
        { service: "supabase", status: "error" },
        { status: 503 },
      );
    }

    return NextResponse.json({ service: "supabase", status: "ok" });
  } catch (error) {
    console.error("Supabase health check failed", error);
    return NextResponse.json(
      { service: "supabase", status: "error" },
      { status: 503 },
    );
  }
}
