type StorageObject = {
  name?: string;
  id?: string | null;
  metadata?: { size?: number | null } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const DEFAULT_PORTFOLIO_SUPABASE_URL = "https://xlyynhcutwplyvjewqwa.supabase.co";
const DEFAULT_BUCKET = "EXPERIENCE AND BLOGS";
const DEFAULT_PREFIX = "Hackathon Certificates";

function storageHeaders(secretKey: string) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    apikey: secretKey,
  };

  if (secretKey.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${secretKey}`;
  }

  return headers;
}

function publicObjectUrl(baseUrl: string, bucket: string, objectPath: string) {
  const encodedBucket = encodeURIComponent(bucket);
  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

export async function GET(_request: Request) {
  const baseUrl =
    process.env.PORTFOLIO_SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim() ||
    DEFAULT_PORTFOLIO_SUPABASE_URL;

  const secretKey =
    process.env.PORTFOLIO_SUPABASE_SECRET_KEY?.trim() ||
    process.env.PORTFOLIO_SUPABASE_SERVICE_ROLE_KEY?.trim();

  const bucket =
    process.env.PORTFOLIO_EXPERIENCE_BUCKET?.trim() || DEFAULT_BUCKET;
  const prefix =
    process.env.PORTFOLIO_HACKATHON_CERTIFICATES_PREFIX?.trim() || DEFAULT_PREFIX;

  if (!secretKey) {
    return Response.json(
      {
        ok: false,
        status: "unconfigured",
        diagnostic:
          "Portfolio Supabase server credential is missing. Add PORTFOLIO_SUPABASE_SECRET_KEY (preferred) or PORTFOLIO_SUPABASE_SERVICE_ROLE_KEY to this Vercel deployment so the server can list Storage objects.",
        bucket,
        prefix,
        files: [],
      },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  try {
    const listUrl =
      `${baseUrl.replace(/\/+$/, "")}/storage/v1/object/list/${encodeURIComponent(bucket)}`;

    const response = await fetch(listUrl, {
      method: "POST",
      headers: storageHeaders(secretKey),
      body: JSON.stringify({
        prefix,
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(7_000),
    });

    if (!response.ok) {
      const body = (await response.text()).slice(0, 300);
      throw new Error(
        `Supabase Storage list failed with HTTP ${response.status}${body ? `: ${body}` : ""}`,
      );
    }

    const rows = (await response.json()) as StorageObject[];
    const files = rows
      .filter(
        (row) =>
          typeof row.name === "string" &&
          row.name.toLowerCase().endsWith(".pdf"),
      )
      .map((row) => {
        const name = row.name as string;
        const objectPath = `${prefix}/${name}`;

        return {
          name,
          objectPath,
          url: publicObjectUrl(baseUrl, bucket, objectPath),
          size: row.metadata?.size ?? null,
          createdAt: row.created_at ?? null,
          updatedAt: row.updated_at ?? null,
        };
      });

    return Response.json(
      {
        ok: true,
        status: "ready",
        bucket,
        prefix,
        count: files.length,
        files,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    const diagnostic =
      error instanceof Error ? error.message : "Unknown Storage listing error";

    return Response.json(
      {
        ok: false,
        status: "error",
        diagnostic,
        bucket,
        prefix,
        files: [],
      },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
