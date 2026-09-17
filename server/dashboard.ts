import { getSupabaseWorkoutSummary, type SupabaseWorkoutSummary } from "./supabase";
import { getCodingSummary, type CodingSummary } from "./wakatime";

export type DashboardPayload = {
  generatedAt: string;
  workouts: SupabaseWorkoutSummary;
  coding: CodingSummary;
  music: {
    provider: "spotify";
    status: "unconfigured";
    isPlaying: null;
  };
};

export async function getWorkoutSummary(): Promise<SupabaseWorkoutSummary> {
  return getSupabaseWorkoutSummary();
}

export async function getDashboardPayload(): Promise<DashboardPayload> {
  const [workouts, coding] = await Promise.all([
    getWorkoutSummary(),
    getCodingSummary(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    workouts,
    coding,
    music: {
      provider: "spotify",
      status: "unconfigured",
      isPlaying: null,
    },
  };
}
