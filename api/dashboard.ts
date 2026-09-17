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
};

const codingFallback = (): CodingSummary => ({
  provider: "wakatime",
  status: process.env.WAKATIME_API_KEY?.trim() ? "error" : "unconfigured",
  todaySeconds: null,
  todayHours: null,
  weekSeconds: null,
  weekHours: null,
  topProject: null,
  topLanguage: null,
  updatedAt: null,
});

const workoutFallback = (): WorkoutSummary => {
  const parsedUserId = Number(process.env.HABIT_TRACKER_USER_ID ?? "7");
  const configured = Boolean(
    process.env.HABIT_TRACKER_SUPABASE_URL?.trim() &&
      (
        process.env.HABIT_TRACKER_SUPABASE_SECRET_KEY?.trim() ||
        process.env.HABIT_TRACKER_SUPABASE_SERVICE_ROLE_KEY?.trim()
      ),
  );

  return {
    provider: "habit-tracker-supabase",
    status: configured ? "error" : "unconfigured",
    habitId: null,
    habitTitle: process.env.HABIT_TRACKER_WORKOUT_TITLE?.trim() || "Workout",
    userId: Number.isFinite(parsedUserId) ? parsedUserId : 7,
    totalCount: null,
    weekCount: null,
    todayCompleted: null,
    recentCompletions: [],
    updatedAt: null,
  };
};

async function loadCoding(): Promise<CodingSummary> {
  try {
    const { getCodingSummary } = await import("../server/wakatime.ts");
    return await getCodingSummary();
  } catch (error) {
    console.error("Dashboard WakaTime provider failure", error);
    return codingFallback();
  }
}

async function loadWorkouts(): Promise<WorkoutSummary> {
  try {
    const { getSupabaseWorkoutSummary } = await import("../server/supabase.ts");
    return await getSupabaseWorkoutSummary();
  } catch (error) {
    console.error("Dashboard workout provider failure", error);
    return workoutFallback();
  }
}

export async function GET(_request: Request) {
  const [coding, workouts] = await Promise.all([loadCoding(), loadWorkouts()]);

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
