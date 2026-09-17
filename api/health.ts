export default async function handler(_request: Request) {
  const wakatimeConfigured = Boolean(process.env.WAKATIME_API_KEY?.trim());
  const workoutSupabaseConfigured = Boolean(
    process.env.HABIT_TRACKER_SUPABASE_URL?.trim() &&
      (
        process.env.HABIT_TRACKER_SUPABASE_SECRET_KEY?.trim() ||
        process.env.HABIT_TRACKER_SUPABASE_SERVICE_ROLE_KEY?.trim()
      ),
  );

  return Response.json({
    ok: true,
    service: "portfolio-api",
    timestamp: new Date().toISOString(),
    providers: {
      wakatimeConfigured,
      workoutSupabaseConfigured,
      workoutUserIdConfigured: Boolean(process.env.HABIT_TRACKER_USER_ID?.trim()),
      workoutTitleConfigured: Boolean(process.env.HABIT_TRACKER_WORKOUT_TITLE?.trim()),
      timezoneConfigured: Boolean(process.env.HABIT_TRACKER_TIMEZONE?.trim()),
    },
  });
}
