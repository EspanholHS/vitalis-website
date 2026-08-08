import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getHubDashboard } from "@/lib/vitalis-dashboard";
import type { HubAnalyticsDay } from "@/lib/vitalis-dashboard";
import type { AnalyticsSummary, DailyDose, DashboardData, HistoryItem, MedicationInput, MedicationWithSchedules } from "./data-types";
import type { HubDataSource } from "./types";

const status = (value: string): DailyDose["status"] =>
  (["pending", "late", "taken", "skipped", "missed", "snoozed"] as const).includes(value as never)
    ? value as DailyDose["status"]
    : "pending";

const generateDoseTimes = (firstDoseTime: string, intervalHours: number) => {
  const [hour, minute] = firstDoseTime.split(":").map(Number);
  const result: string[] = [];
  const seen = new Set<number>();
  let current = hour * 60 + minute;
  while (!seen.has(current) && result.length < 24) {
    seen.add(current);
    result.push(`${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}:00`);
    current = (current + intervalHours * 60) % 1440;
  }
  return result.sort();
};

function convertDose(dose: Awaited<ReturnType<typeof getHubDashboard>>["todayDoses"][number], medication: MedicationWithSchedules): DailyDose {
  return {
    key: dose.key,
    medication,
    scheduledFor: new Date(dose.scheduledFor),
    scheduleTime: dose.scheduleTime,
    event: dose.eventId ? null : null,
    status: status(dose.status),
  };
}

export function createWebHubDataSource(timezone = "America/Sao_Paulo"): HubDataSource {
  async function listMedications(userId: string) {
    const supabase = await createClient();
    const [medications, schedules] = await Promise.all([
      supabase.from("medications").select("*").eq("user_id", userId).order("is_active", { ascending: false }).order("name"),
      supabase.from("medication_schedules").select("*").eq("user_id", userId).order("dose_time"),
    ]);
    if (medications.error) throw medications.error;
    if (schedules.error) throw schedules.error;
    return (medications.data ?? []).map<MedicationWithSchedules>((medication) => ({
      ...medication,
      schedules: (schedules.data ?? []).filter((schedule) => schedule.medication_id === medication.id),
    }));
  }

  async function getDashboard(userId: string): Promise<DashboardData> {
    const [view, medications] = await Promise.all([getHubDashboard(userId, timezone), listMedications(userId)]);
    const medicationMap = new Map(medications.map((medication) => [medication.id, medication]));
    const doses = view.todayDoses
      .map((dose) => {
        const medication = medicationMap.get(dose.medicationId);
        return medication ? convertDose(dose, medication) : null;
      })
      .filter((dose): dose is DailyDose => Boolean(dose));
    return {
      medications,
      doses,
      nextDose: view.nextDose ? doses.find((dose) => dose.key === view.nextDose?.key) ?? null : null,
      plannedCount: view.summary.plannedToday,
      takenCount: view.summary.takenToday,
      lateCount: view.summary.attentionCount,
      adherence: view.summary.adherence,
    };
  }

  async function getAnalytics(userId: string, days = 7): Promise<AnalyticsSummary> {
    const [view, medications] = await Promise.all([getHubDashboard(userId, timezone), listMedications(userId)]);
    const rows = view.analytics.slice(-days).map<AnalyticsSummary["days"][number]>((day: HubAnalyticsDay) => ({
      key: day.dateKey, label: day.label, planned: day.planned, taken: day.taken, skipped: day.skipped,
      duePlanned: day.duePlanned, dueTaken: day.dueTaken, upcoming: Math.max(0, day.planned - day.duePlanned), percent: day.adherence,
    }));
    const planned = rows.reduce((sum, day) => sum + day.planned, 0);
    const taken = rows.reduce((sum, day) => sum + day.taken, 0);
    const duePlanned = rows.reduce((sum, day) => sum + day.duePlanned, 0);
    const dueTaken = rows.reduce((sum, day) => sum + day.dueTaken, 0);
    const byMedication = medications.map((medication) => {
      const medicationRows = view.byMedication.filter((item) => item.medication === medication.name);
      const plannedMedication = medicationRows.reduce((sum, item) => sum + item.planned, 0);
      const takenMedication = medicationRows.reduce((sum, item) => sum + item.taken, 0);
      return { medication, planned: plannedMedication, taken: takenMedication, percent: plannedMedication ? Math.round((takenMedication / plannedMedication) * 100) : 0 };
    }).filter((item) => item.planned > 0);
    return {
      days: rows, adherence: planned ? Math.round((taken / planned) * 100) : 0, dueAdherence: duePlanned ? Math.round((dueTaken / duePlanned) * 100) : 0,
      taken, planned, dueTaken, duePlanned, upcomingCount: rows.reduce((sum, day) => sum + day.upcoming, 0),
      attentionCount: Math.max(0, duePlanned - dueTaken), bestHour: null, criticalHour: null, byMedication,
    };
  }

  async function getHistory(userId: string, days = 30): Promise<HistoryItem[]> {
    const supabase = await createClient();
    const start = new Date(); start.setDate(start.getDate() - days + 1); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setDate(end.getDate() + 1);
    const [events, medications] = await Promise.all([
      supabase.from("dose_events").select("*").eq("user_id", userId).gte("scheduled_for", start.toISOString()).lt("scheduled_for", end.toISOString()).order("scheduled_for", { ascending: false }),
      listMedications(userId),
    ]);
    if (events.error) throw events.error;
    return (events.data ?? []).map((event) => ({ ...event, medication: medications.find((medication) => medication.id === event.medication_id) ?? null }));
  }

  async function recordDose(userId: string, dose: DailyDose, doseStatus: "taken" | "skipped", source: "hub") {
    const supabase = await createClient();
    const { error } = await supabase.from("dose_events").upsert({
      medication_id: dose.medication.id, scheduled_for: dose.scheduledFor.toISOString(), snoozed_until: null,
      source, status: doseStatus, taken_at: doseStatus === "taken" ? new Date().toISOString() : null, user_id: userId,
    }, { onConflict: "medication_id,scheduled_for" });
    if (error) throw error;
  }

  async function createMedication(userId: string, input: MedicationInput) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_medication_with_schedules", {
      p_name: input.name.trim(), p_dosage: input.dosage.trim(), p_instructions: input.instructions.trim(),
      p_interval_hours: input.intervalHours, p_start_date: input.startDate ?? new Date().toISOString().slice(0, 10),
      p_end_date: (input.endDate ?? null) as unknown as string, p_color_token: input.colorToken, p_first_dose_time: input.firstDoseTime,
      p_dose_times: generateDoseTimes(input.firstDoseTime, input.intervalHours),
    });
    if (error) throw error;
    return data;
  }

  return { getDashboard, getAnalytics, getHistory, listMedications, recordDose, createMedication };
}