import { useEffect, useState } from "react";

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

type DashboardData = {
  generatedAt: string;
  workouts: WorkoutSummary;
  coding: CodingSummary;
};

const codingFallback: CodingSummary = {
  provider: "wakatime",
  status: "error",
  todaySeconds: null,
  todayHours: null,
  weekSeconds: null,
  weekHours: null,
  topProject: null,
  topLanguage: null,
  updatedAt: null,
};

const workoutFallback: WorkoutSummary = {
  provider: "habit-tracker-supabase",
  status: "error",
  habitId: null,
  habitTitle: "Workout",
  userId: 7,
  totalCount: null,
  weekCount: null,
  todayCompleted: null,
  recentCompletions: [],
  updatedAt: null,
};

async function fetchJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`${path} failed: ${response.status}`);
  return (await response.json()) as T;
}

export function useDashboardData(refreshMs = 60_000) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const load = async () => {
      const [codingResult, workoutResult] = await Promise.allSettled([
        fetchJson<CodingSummary>("/api/coding", controller.signal),
        fetchJson<WorkoutSummary>("/api/workouts", controller.signal),
      ]);

      if (!active) return;

      const coding =
        codingResult.status === "fulfilled" ? codingResult.value : codingFallback;
      const workouts =
        workoutResult.status === "fulfilled" ? workoutResult.value : workoutFallback;

      setData({
        generatedAt: new Date().toISOString(),
        coding,
        workouts,
      });
      setFailed(
        codingResult.status === "rejected" && workoutResult.status === "rejected",
      );
    };

    void load();
    const interval = window.setInterval(() => void load(), refreshMs);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [refreshMs]);

  return { data, failed };
}

export function formatCodingDuration(seconds: number | null | undefined) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) return "—";

  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
