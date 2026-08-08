import type { DailyDose, DashboardData, HistoryItem, MedicationInput, MedicationWithSchedules, AnalyticsSummary } from "./data-types";

export type MedicationColorToken = "blue" | "mint" | "amber" | "coral" | "violet";

export type HubIntent =
  | "greeting" | "capabilities" | "identity" | "how_it_works" | "gratitude" | "next_dose" | "daily_medications" | "active_medications"
  | "confirm_dose" | "history" | "adherence" | "add_medication" | "navigation"
  | "clinical_safety" | "emergency" | "confirmation" | "cancel" | "correction" | "fallback";

export type MedicationRegistrationStep =
  | "name" | "dosage" | "start_date" | "first_time" | "frequency" | "duration" | "instructions" | "review";

export type MedicationDraft = {
  name?: string;
  dosage?: string;
  startDate?: string;
  firstDoseTime?: string;
  intervalHours?: number;
  durationDays?: number | null;
  endDate?: string | null;
  instructions?: string;
  colorToken?: MedicationColorToken;
};

export type HubDoseReference = { key: string; medicationId: string; medicationName: string; dosage: string; scheduledFor: string };
export type HubMedicationReference = { id: string; name: string; dosage: string };
export type PendingHubAction =
  | { type: "confirm_dose"; dose: HubDoseReference }
  | { type: "save_medication"; draft: Required<MedicationDraft>; duplicateWarning: boolean };
export type MedicationRegistrationFlow = {
  kind: "medication_registration";
  step: MedicationRegistrationStep;
  draft: MedicationDraft;
  duplicateWarning?: boolean;
  returnToReview?: boolean;
};
export type HubConversationState = {
  version: 2;
  currentIntent: HubIntent | null;
  flow: MedicationRegistrationFlow | null;
  lastMedication: HubMedicationReference | null;
  lastDose: HubDoseReference | null;
  pendingAction: PendingHubAction | null;
  fallbackCount: number;
};
export type HubSuggestion = { label: string; prompt: string; icon?: "schedule" | "today" | "check-circle" | "add-circle" | "insights" | "history" };
export type HubFeedbackTone = "default" | "success" | "warning" | "danger";
export type HubResponse = { intent: HubIntent; content: string; context: HubConversationState; suggestions?: HubSuggestion[]; feedbackTone?: HubFeedbackTone };
export type HubDataSource = {
  getDashboard: (userId: string, date?: Date) => Promise<DashboardData>;
  getAnalytics: (userId: string, days?: number) => Promise<AnalyticsSummary>;
  getHistory: (userId: string, days?: number) => Promise<HistoryItem[]>;
  listMedications: (userId: string) => Promise<MedicationWithSchedules[]>;
  recordDose: (userId: string, dose: DailyDose, status: "taken" | "skipped", source: "hub") => Promise<void>;
  createMedication: (userId: string, input: MedicationInput) => Promise<unknown>;
};
export const EMPTY_HUB_CONTEXT: HubConversationState = {
  version: 2, currentIntent: null, flow: null, lastMedication: null, lastDose: null, pendingAction: null, fallbackCount: 0,
};