const DEFAULT_PORTFOLIO_ASSET_BASE_URL =
  "https://pub-1220a4f9bd7a440ab6fc81b776a37cc9.r2.dev";
const DEFAULT_PORTFOLIO_SUPABASE_URL = "https://xlyynhcutwplyvjewqwa.supabase.co";
const RESUME_BUCKET = "Profile PIC";

function publicAssetUrl(baseUrl: string, bucket: string, objectPath: string) {
  const encodedBucket = encodeURIComponent(bucket);
  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl.replace(/\/+$/, "")}/${encodedBucket}/${encodedPath}`;
}

function publicSupabaseObjectUrl(baseUrl: string, bucket: string, objectPath: string) {
  const encodedBucket = encodeURIComponent(bucket);
  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

async function objectExists(url: string) {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (head.ok) return true;
    if (head.status !== 405) return false;

    const ranged = await fetch(url, {
      headers: { Range: "bytes=0-0" },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    return ranged.ok || ranged.status === 206;
  } catch {
    return false;
  }
}

export async function GET(_request: Request) {
  const explicitUrl = process.env.PORTFOLIO_RESUME_URL?.trim();
  if (explicitUrl) {
    return Response.redirect(explicitUrl, 302);
  }

  const assetBaseUrl =
    process.env.PORTFOLIO_ASSET_BASE_URL?.trim() ||
    process.env.VITE_PORTFOLIO_ASSET_BASE_URL?.trim() ||
    DEFAULT_PORTFOLIO_ASSET_BASE_URL;

  const supabaseBaseUrl =
    process.env.PORTFOLIO_SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim() ||
    DEFAULT_PORTFOLIO_SUPABASE_URL;

  const configuredObject = process.env.PORTFOLIO_RESUME_OBJECT?.trim();
  const candidates = [
    configuredObject,
    "Nityan Tiwari Resume.pdf",
    "Nityant Tiwari Resume.pdf",
    "Nityant_Tiwari_Resume.pdf",
    "Nityan_Tiwari_Resume.pdf",
  ].filter((value, index, values): value is string =>
    Boolean(value) && values.indexOf(value) === index,
  );

  // R2 is the primary portfolio asset host.
  for (const objectPath of candidates) {
    const url = publicAssetUrl(assetBaseUrl, RESUME_BUCKET, objectPath);
    if (await objectExists(url)) {
      return Response.redirect(url, 302);
    }
  }

  // Keep the old Supabase location only as an emergency fallback.
  for (const objectPath of candidates) {
    const url = publicSupabaseObjectUrl(supabaseBaseUrl, RESUME_BUCKET, objectPath);
    if (await objectExists(url)) {
      return Response.redirect(url, 302);
    }
  }

  return Response.json(
    {
      ok: false,
      error: "resume_not_found",
      bucket: RESUME_BUCKET,
      diagnostic:
        "No configured/default resume object was found in R2 or the Supabase fallback.",
      tried: candidates,
    },
    {
      status: 404,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
