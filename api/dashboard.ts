import { getDashboardPayload } from "../server/dashboard";

export async function GET(_request: Request) {
  const payload = await getDashboardPayload();

  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
