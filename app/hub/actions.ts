"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthenticatedViewer } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export async function recordDoseAction(formData: FormData) {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) redirect("/entrar?next=/hub");

  const medicationId = String(formData.get("medicationId") ?? "");
  const scheduledFor = String(formData.get("scheduledFor") ?? "");
  const status = String(formData.get("status") ?? "");
  const scheduledDate = new Date(scheduledFor);

  if (
    !medicationId ||
    Number.isNaN(scheduledDate.getTime()) ||
    scheduledDate.getTime() > Date.now() ||
    (status !== "taken" && status !== "skipped")
  ) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("dose_events").upsert(
    {
      medication_id: medicationId,
      scheduled_for: scheduledDate.toISOString(),
      snoozed_until: null,
      source: "hub",
      status,
      taken_at: status === "taken" ? new Date().toISOString() : null,
      user_id: viewer.userId,
    },
    { onConflict: "medication_id,scheduled_for" },
  );

  if (error) throw error;
  revalidatePath("/hub");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
