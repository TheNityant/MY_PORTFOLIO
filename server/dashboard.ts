export type ProviderStatus = "ready" | "unconfigured" | "error";

export type WorkoutSummary = {
  provider: "habit-tracker";
  status: ProviderStatus;
  todayCompleted: boolean | null;
  weekCount: number | null;
  activityType: string;
  durationMinutes: number;
  durationSource: "default";
  recentCompletions: Array<{ date: string; completed: boolean }>;
  updatedAt: string | null;
};

export type DashboardPayload = {
  generatedAt: string;
  workouts: WorkoutSummary;
  coding: {
    provider: "wakatime";
    status: "unconfigured";
    todayHours: null;
    weekHours: null;
  };
  music: {
    provider: "spotify";
    status: "unconfigured";
    isPlaying: null;
  };
};

type HabitTrackerWorkoutResponse = {
  todayCompleted?: boolean;
  weekCount?: number;
  recentCompletions?: Array<{ date: string; completed: boolean }>;
  updatedAt?: string;
};

const parsePositiveNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const defaultWorkoutDurationMinutes = parsePositiveNumber(
  process.env.WORKOUT_DEFAULT_DURATION_MINUTES,
  75,
);

const defaultWorkoutActivityType =
  process.env.WORKOUT_DEFAULT_ACTIVITY_TYPE?.trim() || "strength";

const workoutApiUrl = process.env.HABIT_TRACKER_WORKOUT_API_URL?.trim();
const workoutApiToken = process.env.HABIT_TRACKER_WORKOUT_API_TOKEN?.trim();

const fallbackWorkoutSummary = (
  status: "unconfigured" | "error",
): WorkoutSummary => ({
  provider: "habit-tracker",
  status,
  todayCompleted: null,
  weekCount: null,
  activityType: defaultWorkoutActivityType,
  durationMinutes: defaultWorkoutDurationMinutes,
  durationSource: "default",
  recentCompletions: [],
  updatedAt: null,
});

export async function getWorkoutSummary(): Promise<WorkoutSummary> {
  if (!workoutApiUrl) {
    return fallbackWorkoutSummary("unconfigured");
  }

  try {
    const response = await fetch(workoutApiUrl, {
      headers: workoutApiToken
        ? {
            Authorization: `Bearer ${workoutApiToken}`,
            Accept: "application/json",
          }
        : { Accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return fallbackWorkoutSummary("error");
    }

    const payload = (await response.json()) as HabitTrackerWorkoutResponse;

    return {
      provider: "habit-tracker",
      status: "ready",
      todayCompleted:
        typeof payload.todayCompleted === "boolean"
          ? payload.todayCompleted
          : null,
      weekCount:
        typeof payload.weekCount === "number" && payload.weekCount >= 0
          ? payload.weekCount
          : null,
      activityType: defaultWorkoutActivityType,
      durationMinutes: defaultWorkoutDurationMinutes,
      durationSource: "default",
      recentCompletions: Array.isArray(payload.recentCompletions)
        ? payload.recentCompletions.filter(
            (item) =>
              typeof item?.date === "string" &&
              typeof item?.completed === "boolean",
          )
        : [],
      updatedAt:
        typeof payload.updatedAt === "string"
          ? payload.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return fallbackWorkoutSummary("error");
  }
}

export async function getDashboardPayload(): Promise<DashboardPayload> {
  const workouts = await getWorkoutSummary();

  return {
    generatedAt: new Date().toISOString(),
    workouts,
    coding: {
      provider: "wakatime",
      status: "unconfigured",
      todayHours: null,
      weekHours: null,
    },
    music: {
      provider: "spotify",
      status: "unconfigured",
      isPlaying: null,
    },
  };
}
