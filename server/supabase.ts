export type SupabaseWorkoutStatus = "ready" | "unconfigured" | "error";

export type SupabaseWorkoutSummary = {
  provider: "habit-tracker-supabase";
  status: SupabaseWorkoutStatus;
  habitId: number | null;
  habitTitle: string;
  userId: number;
  totalCount: number | null;
  weekCount: number | null;
  todayCompleted: boolean | null;
  recentCompletions: Array<{ date: string; completed: boolean }>;
  updatedAt: string | null;
};

type HabitRow = {
  habit_id?: number;
  title?: string;
  user_id?: number;
};

type CompletionRow = {
  completed_date?: string;
};

const supabaseUrl = process.env.HABIT_TRACKER_SUPABASE_URL?.trim();
const supabaseSecretKey =
  process.env.HABIT_TRACKER_SUPABASE_SECRET_KEY?.trim() ||
  process.env.HABIT_TRACKER_SUPABASE_SERVICE_ROLE_KEY?.trim();

const parsedUserId = Number(process.env.HABIT_TRACKER_USER_ID ?? "7");
const userId = Number.isFinite(parsedUserId) ? parsedUserId : 7;
const workoutTitle = process.env.HABIT_TRACKER_WORKOUT_TITLE?.trim() || "Workout";
const timezone = process.env.HABIT_TRACKER_TIMEZONE?.trim() || "Asia/Kolkata";

const fallback = (status: Exclude<SupabaseWorkoutStatus, "ready">): SupabaseWorkoutSummary => ({
  provider: "habit-tracker-supabase",
  status,
  habitId: null,
  habitTitle: workoutTitle,
  userId,
  totalCount: null,
  weekCount: null,
  todayCompleted: null,
  recentCompletions: [],
  updatedAt: null,
});

function localDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dateDaysAgo(days: number) {
  const today = localDateString();
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function headers() {
  if (!supabaseSecretKey) return null;
  return {
    Accept: "application/json",
    apikey: supabaseSecretKey,
  };
}

async function fetchJson<T>(url: URL): Promise<T> {
  const requestHeaders = headers();
  if (!requestHeaders) throw new Error("Supabase secret key is not configured");

  const response = await fetch(url, {
    headers: requestHeaders,
    signal: AbortSignal.timeout(7_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Supabase request failed with ${response.status}${body ? `: ${body}` : ""}`);
  }

  return (await response.json()) as T;
}

export async function getSupabaseWorkoutSummary(): Promise<SupabaseWorkoutSummary> {
  if (!supabaseUrl || !supabaseSecretKey) return fallback("unconfigured");

  try {
    const habitUrl = new URL("/rest/v1/habits", supabaseUrl);
    habitUrl.searchParams.set("select", "habit_id,title,user_id");
    habitUrl.searchParams.set("user_id", `eq.${userId}`);
    habitUrl.searchParams.set("title", `eq.${workoutTitle}`);
    habitUrl.searchParams.set("limit", "1");

    const habits = await fetchJson<HabitRow[]>(habitUrl);
    const habit = habits[0];
    const habitId = typeof habit?.habit_id === "number" ? habit.habit_id : null;

    if (habitId == null) return fallback("error");

    const completionsUrl = new URL("/rest/v1/habit_completed_dates", supabaseUrl);
    completionsUrl.searchParams.set("select", "completed_date");
    completionsUrl.searchParams.set("habit_id", `eq.${habitId}`);
    completionsUrl.searchParams.set("order", "completed_date.desc");

    const rows = await fetchJson<CompletionRow[]>(completionsUrl);
    const completedDates = rows
      .map((row) => row.completed_date)
      .filter((date): date is string => typeof date === "string")
      .sort((a, b) => b.localeCompare(a));

    const today = localDateString();
    const sevenDayCutoff = dateDaysAgo(6);
    const weekCount = completedDates.filter(
      (date) => date >= sevenDayCutoff && date <= today,
    ).length;

    return {
      provider: "habit-tracker-supabase",
      status: "ready",
      habitId,
      habitTitle:
        typeof habit.title === "string" && habit.title.trim()
          ? habit.title.trim()
          : workoutTitle,
      userId,
      totalCount: completedDates.length,
      weekCount,
      todayCompleted: completedDates.includes(today),
      recentCompletions: completedDates.slice(0, 14).map((date) => ({
        date,
        completed: true,
      })),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return fallback("error");
  }
}
