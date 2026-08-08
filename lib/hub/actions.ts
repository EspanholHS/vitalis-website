"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedViewer } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/types/database";
import { createEmptyHubContext, parseHubContext, serializeHubContext } from "./context";
import { runHubTurn } from "./engine";
import { createWebHubDataSource } from "./web-data";
import type { MedicationColorToken } from "./types";

export type WebChatMessage = Tables<"chat_messages">;

async function viewerOrThrow() {
  const viewer = await getAuthenticatedViewer();
  if (!viewer) throw new Error("Sess\u00e3o expirada. Entre novamente.");
  return viewer;
}

async function getSessionForViewer(userId: string, sessionId?: string) {
  const supabase = await createClient();
  if (sessionId) {
    const { data, error } = await supabase.from("chat_sessions").select("*").eq("id", sessionId).eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (data) return data;
  }
  const { data: existing, error: readError } = await supabase.from("chat_sessions").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (readError) throw readError;
  if (existing) return existing;
  const { data, error } = await supabase.from("chat_sessions").insert({ user_id: userId, title: "Conversa com a Vitalis" }).select("*").single();
  if (error) throw error;
  return data;
}

export async function loadChatAction(sessionId?: string) {
  const viewer = await viewerOrThrow();
  const session = await getSessionForViewer(viewer.userId, sessionId);
  const supabase = await createClient();
  const { data, error } = await supabase.from("chat_messages").select("*").eq("user_id", viewer.userId).eq("session_id", session.id).order("created_at");
  if (error) throw error;
  return { sessionId: session.id, messages: data ?? [] };
}

export async function sendChatAction(sessionId: string, rawMessage: string) {
  const viewer = await viewerOrThrow();
  const message = rawMessage.trim();
  if (!message) throw new Error("Digite uma mensagem.");
  if (message.length > 4000) throw new Error("A mensagem pode ter no m\u00e1ximo 4000 caracteres.");
  const session = await getSessionForViewer(viewer.userId, sessionId);
  const supabase = await createClient();
  const { data: latest, error: latestError } = await supabase.from("chat_messages").select("metadata").eq("user_id", viewer.userId).eq("session_id", session.id).eq("role", "assistant").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (latestError) throw latestError;
  const { data: userMessage, error: userError } = await supabase.from("chat_messages").insert({ user_id: viewer.userId, session_id: session.id, role: "user", content: message, intent: null, metadata: { engine: "vitalis-rules-v2" } }).select("*").single();
  if (userError) throw userError;
  const response = await runHubTurn({
    userId: viewer.userId,
    message,
    previousContext: latest ? parseHubContext(latest.metadata) : createEmptyHubContext(),
    data: createWebHubDataSource(viewer.profile?.timezone ?? "America/Sao_Paulo"),
  });
  const metadata: Json = {
    engine: "vitalis-rules-v2",
    context: serializeHubContext(response.context),
    suggestions: (response.suggestions ?? []) as unknown as Json,
    feedbackTone: response.feedbackTone ?? "default",
  };
  const { data: assistantMessage, error: assistantError } = await supabase.from("chat_messages").insert({ user_id: viewer.userId, session_id: session.id, role: "assistant", content: response.content, intent: response.intent, metadata }).select("*").single();
  if (assistantError) throw assistantError;
  const { error: sessionError } = await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", session.id).eq("user_id", viewer.userId);
  if (sessionError) throw sessionError;
  revalidatePath("/hub");
  revalidatePath("/hub/relatorios");
  return { userMessage, assistantMessage, dashboardChanged: ["confirm_dose", "add_medication"].includes(response.intent) };
}

function todayKey(timezone = "America/Sao_Paulo") { return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function validColor(value: string): value is MedicationColorToken { return ["blue", "mint", "amber", "coral", "violet"].includes(value); }
function generateDoseTimes(firstDoseTime: string, intervalHours: number) {
  const [hour, minute] = firstDoseTime.split(":").map(Number); const result: string[] = []; const seen = new Set<number>(); let current = hour * 60 + minute;
  while (!seen.has(current) && result.length < 24) { seen.add(current); result.push(`${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}:00`); current = (current + intervalHours * 60) % 1440; }
  return result.sort();
}
function calculateEndDate(startDate: string, durationDays: number | null) {
  if (durationDays === null) return null;
  const [year, month, day] = startDate.split("-").map(Number); const date = new Date(year, month - 1, day); date.setDate(date.getDate() + durationDays - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export type MedicationFormInput = {
  name: string; dosage: string; firstDoseTime: string; intervalHours: number; durationDays: number | null; instructions: string; colorToken: string;
};

export async function createMedicationAction(input: MedicationFormInput) {
  const viewer = await viewerOrThrow();
  const name = input.name.trim(); const dosage = input.dosage.trim(); const instructions = input.instructions.trim();
  if (name.length < 2 || name.length > 120) throw new Error("Digite um nome de medicamento entre 2 e 120 caracteres.");
  if (!dosage || dosage.length > 80) throw new Error("Informe a dosagem, por exemplo: 50 mg.");
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(input.firstDoseTime)) throw new Error("Informe um hor\u00e1rio v\u00e1lido.");
  if (![6, 8, 12, 24].includes(input.intervalHours)) throw new Error("Escolha uma frequ\u00eancia v\u00e1lida.");
  if (input.durationDays !== null && (!Number.isInteger(input.durationDays) || input.durationDays < 1 || input.durationDays > 3650)) throw new Error("Informe uma dura\u00e7\u00e3o v\u00e1lida.");
  if (instructions.length > 500) throw new Error("A orienta\u00e7\u00e3o pode ter no m\u00e1ximo 500 caracteres.");
  if (!validColor(input.colorToken)) throw new Error("Escolha uma cor v\u00e1lida.");
  const startDate = todayKey(viewer.profile?.timezone ?? "America/Sao_Paulo");
  const endDate = calculateEndDate(startDate, input.durationDays);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_medication_with_schedules", {
    p_name: name, p_dosage: dosage, p_instructions: instructions, p_interval_hours: input.intervalHours,
    p_start_date: startDate, p_end_date: endDate as unknown as string, p_color_token: input.colorToken, p_first_dose_time: input.firstDoseTime,
    p_dose_times: generateDoseTimes(input.firstDoseTime, input.intervalHours),
  });
  if (error) throw error;
  revalidatePath("/hub"); revalidatePath("/hub/relatorios");
  return { ok: true, medicationId: data };
}