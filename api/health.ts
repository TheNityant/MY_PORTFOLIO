export async function GET(_request: Request) {
  const hasWakatimeKey = Boolean(process.env.WAKATIME_API_KEY?.trim());
  const hasSupabaseUrl = Boolean(process.env.HABIT_TRACKER_SUPABASE_URL?.trim());
  const hasSupabaseSecretKey = Boolean(
    process.env.HABIT_TRACKER_SUPABASE_SECRET_KEY?.trim(),
  );
  const hasSupabaseServiceRoleKey = Boolean(
    process.env.HABIT_TRACKER_SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );

  return Response.json({
    ok: true,
    service: "portfolio-api",
    timestamp: new Date().toISOString(),
    deployment: {
      env: process.env.VERCEL_ENV ?? null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    },
    providers: {
      wakatimeConfigured: hasWakatimeKey,
      workoutSupabaseConfigured:
        hasSupabaseUrl && (hasSupabaseSecretKey || hasSupabaseServiceRoleKey),
      workoutUserIdConfigured: Boolean(process.env.HABIT_TRACKER_USER_ID?.trim()),
      workoutTitleConfigured: Boolean(process.env.HABIT_TRACKER_WORKOUT_TITLE?.trim()),
      timezoneConfigured: Boolean(process.env.HABIT_TRACKER_TIMEZONE?.trim()),
    },
    envPresence: {
      habitTrackerSupabaseUrl: hasSupabaseUrl,
      habitTrackerSupabaseSecretKey: hasSupabaseSecretKey,
      habitTrackerSupabaseServiceRoleKey: hasSupabaseServiceRoleKey,
    },
  });
}
