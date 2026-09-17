import { getWorkoutSummary } from "../server/dashboard";

export default {
  async fetch() {
    const workouts = await getWorkoutSummary();

    return Response.json(workouts, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
      },
    });
  },
};
