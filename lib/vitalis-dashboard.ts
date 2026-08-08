import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

type Medication = Tables<"medications">;
type Schedule = Tables<"medication_schedules">;
type DoseEvent = Tables<"dose_events">;

export type HubDoseStatus =
  | "pending"
  | "late"
  | "taken"
  | "skipped"
  | "missed"
  | "snoozed";

export type HubDose = {
  canRecord: boolean;
  color: string;
  dosage: string;
  eventId: string | null;
  instructions: string | null;
  key: string;
  medicationId: string;
  medicationName: string;
  scheduledFor: string;
  scheduleTime: string;
  status: HubDoseStatus;
};

export type HubAnalyticsDay = {
  adherence: number;
  dateKey: string;
  duePlanned: number;
  dueTaken: number;
  label: string;
  planned: number;
  skipped: number;
  taken: number;
};

export type HubMedicationMetric = {
  color: string;
  medication: string;
  percent: number;
  planned: number;
  taken: number;
};

export type HubHistoryItem = {
  color: string;
  id: string;
  medicationName: string;
  scheduledFor: string;
  status: HubDoseStatus;
  takenAt: string | null;
};

export type HubDashboardData = {
  activeMedicationCount: number;
  analytics: HubAnalyticsDay[];
  byMedication: HubMedicationMetric[];
  history: HubHistoryItem[];
  nextDose: HubDose | null;
  summary: {
    adherence: number;
    attentionCount: number;
    duePlanned: number;
    dueTaken: number;
    plannedToday: number;
    takenToday: number;
  };
  timezone: string;
  todayDoses: HubDose[];
};

type MedicationWithSchedules = Medication & { schedules: Schedule[] };

type ZonedParts = {
  day: number;
  hour: number;
  minute: number;
  month: number;
  year: number;
};

const COLOR_MAP: Record<string, string> = {
  amber: "#d9963d",
  blue: "#2d73d5",
  coral: "#d86f5c",
  green: "#36956b",
  mint: "#48a78a",
  orange: "#d47b3d",
  purple: "#8b6cc0",
  red: "#c95c5c",
  teal: "#328d98",
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function zonedFormatter(timezone: string) {
  const cached = formatterCache.get(timezone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  });
  formatterCache.set(timezone, formatter);
  return formatter;
}

function zonedParts(date: Date, timezone: string): ZonedParts {
  const values = Object.fromEntries(
    zonedFormatter(timezone)
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    day: values.day,
    hour: values.hour === 24 ? 0 : values.hour,
    minute: values.minute,
    month: values.month,
    year: values.year,
  };
}

function toDateKey(parts: Pick<ZonedParts, "day" | "month" | "year">) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function addDays(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + amount, 12));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

function zonedDateTimeToUtc(dateKey: string, time: string, timezone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;

  for (let index = 0; index < 3; index += 1) {
    const parts = zonedParts(new Date(guess), timezone);
    const represented = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    const correction = target - represented;
    guess += correction;
    if (correction === 0) break;
  }

  return new Date(guess);
}

function localEventKey(
  medicationId: string,
  date: Date,
  timezone: string,
) {
  const parts = zonedParts(date, timezone);
  return `${medicationId}|${toDateKey(parts)}|${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

function scheduleKey(medicationId: string, dateKey: string, doseTime: string) {
  return `${medicationId}|${dateKey}|${doseTime.slice(0, 5)}`;
}

function scheduleIsActiveOnDate(
  dateKey: string,
  medication: Medication,
  doseTime: string,
) {
  if (dateKey < medication.start_date) return false;
  if (medication.end_date && dateKey > medication.end_date) return false;
  if (dateKey > medication.start_date) return true;
  return doseTime.slice(0, 5) >= medication.first_dose_time.slice(0, 5);
}

function medicationColor(token: string) {
  return COLOR_MAP[token.toLowerCase()] ?? "#2d73d5";
}

function normalizeStatus(status: string): HubDoseStatus {
  if (
    status === "taken" ||
    status === "skipped" ||
    status === "missed" ||
    status === "snoozed" ||
    status === "late"
  ) {
    return status;
  }
  return "pending";
}

function dayLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(year, month - 1, day, 12)))
    .replace(".", "");
}

function buildDose(
  medication: Medication,
  schedule: Schedule,
  dateKey: string,
  timezone: string,
  event: DoseEvent | undefined,
  now: Date,
): HubDose {
  const scheduledFor = zonedDateTimeToUtc(dateKey, schedule.dose_time, timezone);
  const status = event
    ? normalizeStatus(event.status)
    : scheduledFor.getTime() < now.getTime()
      ? "late"
      : "pending";

  return {
    canRecord:
      scheduledFor.getTime() <= now.getTime() &&
      status !== "taken" &&
      status !== "skipped",
    color: medicationColor(medication.color_token),
    dosage: medication.dosage,
    eventId: event?.id ?? null,
    instructions: medication.instructions,
    key: `${medication.id}-${dateKey}-${schedule.dose_time}`,
    medicationId: medication.id,
    medicationName: medication.name,
    scheduledFor: scheduledFor.toISOString(),
    scheduleTime: schedule.dose_time,
    status,
  };
}

export async function getHubDashboard(
  userId: string,
  timezone = "America/Sao_Paulo",
): Promise<HubDashboardData> {
  const supabase = await createClient();
  const now = new Date();
  const todayKey = toDateKey(zonedParts(now, timezone));
  const firstKey = addDays(todayKey, -89);
  const tomorrowKey = addDays(todayKey, 1);
  const rangeStart = zonedDateTimeToUtc(firstKey, "00:00", timezone);
  const rangeEnd = zonedDateTimeToUtc(tomorrowKey, "00:00", timezone);

  const [medicationResult, scheduleResult, eventResult] = await Promise.all([
    supabase
      .from("medications")
      .select("*")
      .eq("user_id", userId)
      .order("is_active", { ascending: false })
      .order("name"),
    supabase
      .from("medication_schedules")
      .select("*")
      .eq("user_id", userId)
      .order("dose_time"),
    supabase
      .from("dose_events")
      .select("*")
      .eq("user_id", userId)
      .gte("scheduled_for", rangeStart.toISOString())
      .lt("scheduled_for", rangeEnd.toISOString())
      .order("scheduled_for", { ascending: false }),
  ]);

  if (medicationResult.error) throw medicationResult.error;
  if (scheduleResult.error) throw scheduleResult.error;
  if (eventResult.error) throw eventResult.error;

  const schedules = scheduleResult.data ?? [];
  const medications: MedicationWithSchedules[] = (
    medicationResult.data ?? []
  ).map((medication) => ({
    ...medication,
    schedules: schedules.filter(
      (schedule) => schedule.medication_id === medication.id,
    ),
  }));
  const events = eventResult.data ?? [];
  const eventMap = new Map(
    events.map((event) => [
      localEventKey(
        event.medication_id,
        new Date(event.scheduled_for),
        timezone,
      ),
      event,
    ]),
  );

  const dateKeys = Array.from({ length: 90 }, (_, index) =>
    addDays(firstKey, index),
  );
  const dosesByDay = new Map<string, HubDose[]>();

  for (const dateKey of dateKeys) {
    const doses = medications
      .filter((medication) =>
        scheduleIsActiveOnDate(
          dateKey,
          medication,
          medication.first_dose_time,
        ),
      )
      .flatMap((medication) =>
        medication.schedules
          .filter((schedule) =>
            scheduleIsActiveOnDate(dateKey, medication, schedule.dose_time),
          )
          .map((schedule) =>
            buildDose(
              medication,
              schedule,
              dateKey,
              timezone,
              eventMap.get(
                scheduleKey(medication.id, dateKey, schedule.dose_time),
              ),
              now,
            ),
          ),
      )
      .sort(
        (first, second) =>
          new Date(first.scheduledFor).getTime() -
          new Date(second.scheduledFor).getTime(),
      );
    dosesByDay.set(dateKey, doses);
  }

  const analytics = dateKeys.map<HubAnalyticsDay>((dateKey) => {
    const doses = dosesByDay.get(dateKey) ?? [];
    const due = doses.filter(
      (dose) => new Date(dose.scheduledFor).getTime() <= now.getTime(),
    );
    const taken = doses.filter((dose) => dose.status === "taken").length;
    const dueTaken = due.filter((dose) => dose.status === "taken").length;
    const skipped = doses.filter(
      (dose) => dose.status === "skipped" || dose.status === "missed",
    ).length;
    return {
      adherence: due.length ? Math.round((dueTaken / due.length) * 100) : 100,
      dateKey,
      duePlanned: due.length,
      dueTaken,
      label: dayLabel(dateKey),
      planned: doses.length,
      skipped,
      taken,
    };
  });

  const todayDoses = (dosesByDay.get(todayKey) ?? []).filter((dose) => {
    const medication = medications.find(
      (item) => item.id === dose.medicationId,
    );
    return medication?.is_active;
  });
  const nextDose =
    todayDoses.find((dose) =>
      ["pending", "late", "snoozed"].includes(dose.status),
    ) ?? null;

  const recentDays = analytics.slice(-30);
  const duePlanned = recentDays.reduce(
    (total, day) => total + day.duePlanned,
    0,
  );
  const dueTaken = recentDays.reduce(
    (total, day) => total + day.dueTaken,
    0,
  );

  const byMedication = medications
    .map<HubMedicationMetric>((medication) => {
      const doses = dateKeys
        .slice(-30)
        .flatMap((dateKey) => dosesByDay.get(dateKey) ?? [])
        .filter((dose) => dose.medicationId === medication.id)
        .filter(
          (dose) => new Date(dose.scheduledFor).getTime() <= now.getTime(),
        );
      const taken = doses.filter((dose) => dose.status === "taken").length;
      return {
        color: medicationColor(medication.color_token),
        medication: medication.name,
        percent: doses.length ? Math.round((taken / doses.length) * 100) : 0,
        planned: doses.length,
        taken,
      };
    })
    .filter((item) => item.planned > 0)
    .sort((first, second) => second.percent - first.percent);

  const medicationById = new Map(
    medications.map((medication) => [medication.id, medication]),
  );
  const history = events.slice(0, 8).map<HubHistoryItem>((event) => {
    const medication = medicationById.get(event.medication_id);
    return {
      color: medicationColor(medication?.color_token ?? "blue"),
      id: event.id,
      medicationName: medication?.name ?? "Medicamento",
      scheduledFor: event.scheduled_for,
      status: normalizeStatus(event.status),
      takenAt: event.taken_at,
    };
  });
  const todayTaken = todayDoses.filter(
    (dose) => dose.status === "taken",
  ).length;
  const attentionCount = todayDoses.filter((dose) =>
    ["late", "missed"].includes(dose.status),
  ).length;

  return {
    activeMedicationCount: medications.filter(
      (medication) => medication.is_active,
    ).length,
    analytics,
    byMedication,
    history,
    nextDose,
    summary: {
      adherence: duePlanned ? Math.round((dueTaken / duePlanned) * 100) : 0,
      attentionCount,
      duePlanned,
      dueTaken,
      plannedToday: todayDoses.length,
      takenToday: todayTaken,
    },
    timezone,
    todayDoses,
  };
}
