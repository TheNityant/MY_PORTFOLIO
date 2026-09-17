import { useEffect, useState } from "react";

type CodingSummary = {
  provider: "wakatime";
  status: "ready" | "unconfigured" | "error" | "stale";
  totalSeconds: number | null;
  totalHours: number | null;
  totalText: string | null;
  isUpToDate: boolean | null;
  percentCalculated: number | null;
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
  totalDays: number | null;
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
  totalSeconds: null,
  totalHours: null,
  totalText: null,
  isUpToDate: null,
  percentCalculated: null,
  updatedAt: null,
};

const workoutFallback: WorkoutSummary = {
  provider: "habit-tracker-supabase",
  status: "error",
  habitId: null,
  habitTitle: "Workout",
  userId: 7,
  totalCount: null,
  totalDays: null,
  weekCount: null,
  todayCompleted: null,
  recentCompletions: [],
  updatedAt: null,
};

async function fetchJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    signal,
    cache: "no-store",
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

export function formatWorkoutDays(days: number | null | undefined) {
  if (typeof days !== "number" || !Number.isFinite(days) || days < 0) return "—";
  return `${days} ${days === 1 ? "day" : "days"}`;
}
