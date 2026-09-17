export default async function handler(_request: Request) {
  return Response.json({
    ok: true,
    service: "portfolio-api",
    timestamp: new Date().toISOString(),
  });
}
