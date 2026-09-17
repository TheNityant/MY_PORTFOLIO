import { getDashboardPayload } from "../server/dashboard";

export default {
  async fetch() {
    const payload = await getDashboardPayload();

    return Response.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
      },
    });
  },
};
