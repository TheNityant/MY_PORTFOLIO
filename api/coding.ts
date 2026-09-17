import { getCodingSummary } from "../server/wakatime";

export async function GET(_request: Request) {
  const coding = await getCodingSummary();

  return Response.json(coding, {
    headers: {
      "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
