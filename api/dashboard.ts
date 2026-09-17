type CodingSummary = {
  provider: "wakatime";
  status: "ready" | "unconfigured" | "error" | "stale";
  todaySeconds: number | null;
  todayHours: number | null;
  weekSeconds: number | null;
  weekHours: number | null;
  topProject: string | null;
  topLanguage: string | null;
  updatedAt: string | null;
  diagnostic?: string;
};

type WorkoutSummary = {
  provider: "habit-tracker-supabase";
  status: "ready" | "unconfigured" | "error";
  habitId: number | null;
  habitTitle: string;
  userId: number;
  totalCount: number | null;
  weekCount: number | null;
  todayCompleted: boolean | null;
  recentCompletions: Array<{ date: string; completed: boolean }>;
  updatedAt: string | null;
  diagnostic?: string;
};

function codingFallback(diagnostic: string): CodingSummary {
  return {
    provider: "wakatime",
    status: process.env.WAKATIME_API_KEY?.trim() ? "error" : "unconfigured",
    todaySeconds: null,
    todayHours: null,
    weekSeconds: null,
    weekHours: null,
    topProject: null,
    topLanguage: null,
    updatedAt: null,
    diagnostic,
  };
}

function workoutFallback(diagnostic: string): WorkoutSummary {
  const parsedUserId = Number(process.env.HABIT_TRACKER_USER_ID ?? "7");
  return {
    provider: "habit-tracker-supabase",
    status: "error",
    habitId: null,
    habitTitle: process.env.HABIT_TRACKER_WORKOUT_TITLE?.trim() || "Workout",
    userId: Number.isFinite(parsedUserId) ? parsedUserId : 7,
    totalCount: null,
    weekCount: null,
    todayCompleted: null,
    recentCompletions: [],
    updatedAt: null,
    diagnostic,
  };
}

async function fetchProvider<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Provider route returned HTTP ${response.status}`);
  return (await response.json()) as T;
}

export async function GET(request: Request) {
  const base = new URL(request.url);
  const codingUrl = new URL("/api/coding", base);
  const workoutsUrl = new URL("/api/workouts", base);

  const [codingResult, workoutResult] = await Promise.allSettled([
    fetchProvider<CodingSummary>(codingUrl),
    fetchProvider<WorkoutSummary>(workoutsUrl),
  ]);

  const coding =
    codingResult.status === "fulfilled"
      ? codingResult.value
      : codingFallback(
          codingResult.reason instanceof Error
            ? codingResult.reason.message
            : "Dashboard could not load WakaTime",
        );

  const workouts =
    workoutResult.status === "fulfilled"
      ? workoutResult.value
      : workoutFallback(
          workoutResult.reason instanceof Error
            ? workoutResult.reason.message
            : "Dashboard could not load workouts",
        );

  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      coding,
      workouts,
      music: {
        provider: "spotify",
        status: "unconfigured",
        isPlaying: null,
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
