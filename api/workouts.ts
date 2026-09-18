type WorkoutSummary = {
  provider: "habit-tracker-supabase";
  status: "ready" | "unconfigured" | "error";
  habitId: number | null;
  habitTitle: string;
  userId: number;
  totalCount: number | null;
  totalDays: number | null;
  weekCount: number | null;
  todayCompleted: boolean | null;
  recentCompletions: Array<{ date: string; completed: boolean }>;
  updatedAt: string | null;
  diagnostic?: string;
};

type HabitRow = {
  habit_id?: number;
  title?: string;
  user_id?: number;
};

type CompletionRow = {
  completed_date?: string;
};

function fallback(
  status: "unconfigured" | "error",
  habitTitle: string,
  userId: number,
  diagnostic?: string,
): WorkoutSummary {
  return {
    provider: "habit-tracker-supabase",
    status,
    habitId: null,
    habitTitle,
    userId,
    totalCount: null,
    totalDays: null,
    weekCount: null,
    todayCompleted: null,
    recentCompletions: [],
    updatedAt: null,
    ...(diagnostic ? { diagnostic } : {}),
  };
}

function dateInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) throw new Error("Unable to format local workout date");
  return `${year}-${month}-${day}`;
}

function daysAgoIso(days: number, timezone: string) {
  const today = dateInTimezone(new Date(), timezone);
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function supabaseHeaders(secretKey: string) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    apikey: secretKey,
  };

  if (secretKey.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${secretKey}`;
  }

  return headers;
}

async function fetchJson<T>(url: URL, secretKey: string): Promise<T> {
  const response = await fetch(url, {
    headers: supabaseHeaders(secretKey),
    cache: "no-store",
    signal: AbortSignal.timeout(7_000),
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed with HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function GET(_request: Request) {
  const supabaseUrl =
    process.env.HABIT_TRACKER_SUPABASE_URL?.trim() ||
    process.env.HABIT_TRACKER_WORKOUT_API_URL?.trim();

  const supabaseSecretKey =
    process.env.HABIT_TRACKER_SUPABASE_SECRET_KEY?.trim() ||
    process.env.HABIT_TRACKER_SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.HABIT_TRACKER_WORKOUT_API_TOKEN?.trim();

  const parsedUserId = Number(process.env.HABIT_TRACKER_USER_ID ?? "7");
  const userId = Number.isFinite(parsedUserId) ? parsedUserId : 7;
  const habitTitle = process.env.HABIT_TRACKER_WORKOUT_TITLE?.trim() || "Workout";
  const timezone = process.env.HABIT_TRACKER_TIMEZONE?.trim() || "Asia/Kolkata";

  // This portfolio belongs to the Habit Tracker user whose Workout habit is id 17.
  // Keep it overridable so a future database migration does not require a code edit.
  const parsedWorkoutHabitId = Number(
    process.env.HABIT_TRACKER_WORKOUT_HABIT_ID ?? "17",
  );
  const configuredWorkoutHabitId =
    Number.isInteger(parsedWorkoutHabitId) && parsedWorkoutHabitId > 0
      ? parsedWorkoutHabitId
      : null;

  if (!supabaseUrl || !supabaseSecretKey) {
    return Response.json(
      fallback(
        "unconfigured",
        habitTitle,
        userId,
        "Supabase URL or secret key is missing from this deployment",
      ),
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }

  try {
    let habitId = configuredWorkoutHabitId;
    let resolvedHabitTitle = habitTitle;

    if (habitId != null) {
      const habitUrl = new URL("/rest/v1/habits", supabaseUrl);
      habitUrl.searchParams.set("select", "habit_id,title,user_id");
      habitUrl.searchParams.set("habit_id", `eq.${habitId}`);
      habitUrl.searchParams.set("user_id", `eq.${userId}`);
      habitUrl.searchParams.set("limit", "1");

      const habits = await fetchJson<HabitRow[]>(habitUrl, supabaseSecretKey);
      const habit = habits[0];

      if (!habit) {
        return Response.json(
          fallback(
            "error",
            habitTitle,
            userId,
            `Workout habit ${habitId} not found for user ${userId}`,
          ),
          {
            status: 200,
            headers: { "Cache-Control": "no-store, max-age=0" },
          },
        );
      }

      if (typeof habit.title === "string" && habit.title.trim()) {
        resolvedHabitTitle = habit.title.trim();
      }
    } else {
      const habitUrl = new URL("/rest/v1/habits", supabaseUrl);
      habitUrl.searchParams.set("select", "habit_id,title,user_id");
      habitUrl.searchParams.set("user_id", `eq.${userId}`);
      habitUrl.searchParams.set("title", `eq.${habitTitle}`);
      habitUrl.searchParams.set("limit", "1");

      const habits = await fetchJson<HabitRow[]>(habitUrl, supabaseSecretKey);
      const habit = habits[0];
      habitId = typeof habit?.habit_id === "number" ? habit.habit_id : null;

      if (habitId == null) {
        return Response.json(
          fallback("error", habitTitle, userId, `Workout habit not found for user ${userId}`),
          {
            status: 200,
            headers: { "Cache-Control": "no-store, max-age=0" },
          },
        );
      }

      if (typeof habit?.title === "string" && habit.title.trim()) {
        resolvedHabitTitle = habit.title.trim();
      }
    }

    const completionsUrl = new URL("/rest/v1/habit_completed_dates", supabaseUrl);
    completionsUrl.searchParams.set("select", "completed_date");
    completionsUrl.searchParams.set("habit_id", `eq.${habitId}`);
    completionsUrl.searchParams.set("order", "completed_date.desc");

    const rows = await fetchJson<CompletionRow[]>(completionsUrl, supabaseSecretKey);
    const completedDates = rows
      .map((row) => row.completed_date)
      .filter((date): date is string => typeof date === "string")
      .sort((a, b) => b.localeCompare(a));

    const uniqueCompletedDates = [...new Set(completedDates)].sort((a, b) =>
      b.localeCompare(a),
    );

    const today = dateInTimezone(new Date(), timezone);
    const cutoff = daysAgoIso(6, timezone);
    const weekCount = uniqueCompletedDates.filter(
      (date) => date >= cutoff && date <= today,
    ).length;

    const payload: WorkoutSummary = {
      provider: "habit-tracker-supabase",
      status: "ready",
      habitId,
      habitTitle: resolvedHabitTitle,
      userId,
      totalCount: completedDates.length,
      totalDays: uniqueCompletedDates.length,
      weekCount,
      todayCompleted: uniqueCompletedDates.includes(today),
      recentCompletions: uniqueCompletedDates.slice(0, 14).map((date) => ({
        date,
        completed: true,
      })),
      updatedAt: new Date().toISOString(),
    };

    return Response.json(payload, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Workout function failure", error);
    const diagnostic = error instanceof Error ? error.message : "Unknown workout runtime error";
    return Response.json(fallback("error", habitTitle, userId, diagnostic), {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}
