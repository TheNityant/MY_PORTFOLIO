const DEFAULT_PORTFOLIO_SUPABASE_URL = "https://xlyynhcutwplyvjewqwa.supabase.co";
const RESUME_BUCKET = "Profile PIC";

function publicObjectUrl(baseUrl: string, bucket: string, objectPath: string) {
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

  const baseUrl =
    process.env.PORTFOLIO_SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim() ||
    DEFAULT_PORTFOLIO_SUPABASE_URL;

  const configuredObject = process.env.PORTFOLIO_RESUME_OBJECT?.trim();
  const candidates = [
    configuredObject,
    "Nityant Tiwari Resume.pdf",
    "Nityan Tiwari Resume.pdf",
    "Nityant_Tiwari_Resume.pdf",
    "Nityan_Tiwari_Resume.pdf",
  ].filter((value, index, values): value is string =>
    Boolean(value) && values.indexOf(value) === index,
  );

  for (const objectPath of candidates) {
    const url = publicObjectUrl(baseUrl, RESUME_BUCKET, objectPath);
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
        "No configured/default resume object was found. Set PORTFOLIO_RESUME_OBJECT to the exact object path shown in Supabase Storage.",
      tried: candidates,
    },
    {
      status: 404,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
