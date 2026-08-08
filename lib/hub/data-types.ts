import type { Tables } from "@/types/database";

export type Medication = Tables<"medications">;
export type MedicationSchedule = Tables<"medication_schedules">;
export type DoseEvent = Tables<"dose_events">;
export type MedicationWithSchedules = Medication & { schedules: MedicationSchedule[] };
export type MedicationInput = {
  name: string; dosage: string; instructions: string; intervalHours: number; firstDoseTime: string;
  startDate?: string; endDate?: string | null; colorToken: "blue" | "mint" | "amber" | "coral" | "violet";
};
export type DoseStatus = "pending" | "late" | "taken" | "skipped" | "missed" | "snoozed";
export type DailyDose = {
  key: string; medication: Medication; scheduledFor: Date; scheduleTime: string; event: DoseEvent | null; status: DoseStatus;
};
export type DashboardData = {
  medications: MedicationWithSchedules[]; doses: DailyDose[]; nextDose: DailyDose | null;
  plannedCount: number; takenCount: number; lateCount: number; adherence: number;
};
export type AnalyticsDay = {
  key: string; label: string; planned: number; taken: number; skipped: number; duePlanned: number; dueTaken: number; upcoming: number; percent: number;
};
export type AnalyticsSummary = {
  days: AnalyticsDay[]; adherence: number; dueAdherence: number; taken: number; planned: number; dueTaken: number; duePlanned: number;
  upcomingCount: number; attentionCount: number; bestHour: string | null; criticalHour: string | null;
  byMedication: { medication: Medication; taken: number; planned: number; percent: number }[];
};
export type HistoryItem = DoseEvent & { medication: Medication | null };