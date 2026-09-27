const DEFAULT_PORTFOLIO_ASSET_BASE_URL =
  "https://pub-1220a4f9bd7a440ab6fc81b776a37cc9.r2.dev";
const BUCKET = "EXPERIENCE AND BLOGS";
const ALLOWED_CERTIFICATES = new Set([
  "ADOBE.pdf",
  "CODORA.pdf",
  "DEV_FUSION_IITBOMBAY.pdf",
  "SPIT_HACKATHON_FEB26.pdf",
]);

function objectUrl(baseUrl: string, objectPath: string) {
  const encodedBucket = encodeURIComponent(BUCKET);
  const encodedPath = objectPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl.replace(/\/+$/, "")}/${encodedBucket}/${encodedPath}`;
}

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("name")?.trim() ?? "";

  if (!ALLOWED_CERTIFICATES.has(name)) {
    return Response.json(
      { ok: false, error: "certificate_not_found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const baseUrl =
    process.env.PORTFOLIO_ASSET_BASE_URL?.trim() ||
    process.env.VITE_PORTFOLIO_ASSET_BASE_URL?.trim() ||
    DEFAULT_PORTFOLIO_ASSET_BASE_URL;

  try {
    const upstream = await fetch(objectUrl(baseUrl, name), {
      cache: "force-cache",
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok || !upstream.body) {
      return Response.json(
        { ok: false, error: "certificate_upstream_failed", status: upstream.status },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Content-Disposition": `inline; filename="${name.replace(/"/g, "")}"`,
      },
    });
  } catch {
    return Response.json(
      { ok: false, error: "certificate_fetch_failed" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
