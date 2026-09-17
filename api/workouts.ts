type WorkoutErrorPayload = {
  provider: "habit-tracker-supabase";
  status: "error";
  habitId: null;
  habitTitle: string;
  userId: number;
  totalCount: null;
  weekCount: null;
  todayCompleted: null;
  recentCompletions: [];
  updatedAt: null;
  diagnostic: string;
};

function diagnosticMessage(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return "Unknown runtime error";
}

export async function GET(_request: Request) {
  try {
    const { getSupabaseWorkoutSummary } = await import("../server/supabase.ts");
    const workouts = await getSupabaseWorkoutSummary();

    return Response.json(workouts, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Workout function runtime failure", error);

    const parsedUserId = Number(process.env.HABIT_TRACKER_USER_ID ?? "7");
    const payload: WorkoutErrorPayload = {
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
      diagnostic: diagnosticMessage(error),
    };

    return Response.json(payload, { status: 200 });
  }
}
