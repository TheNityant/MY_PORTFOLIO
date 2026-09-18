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
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

function normalizePrefix(prefix: string) {
  return prefix.trim().replace(/^\/+|\/+$/g, "");
}

function joinObjectPath(prefix: string, name: string) {
  const cleanPrefix = normalizePrefix(prefix);
  const cleanName = name.replace(/^\/+/, "");
  return cleanPrefix ? `${cleanPrefix}/${cleanName}` : cleanName;
}

async function listObjects(
  baseUrl: string,
  bucket: string,
  prefix: string,
  secretKey: string,
) {
  const listUrl =
    `${baseUrl.replace(/\/+$/, "")}/storage/v1/object/list/${encodeURIComponent(bucket)}`;

  const response = await fetch(listUrl, {
    method: "POST",
    headers: storageHeaders(secretKey),
    body: JSON.stringify({
      prefix,
      limit: 1000,
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

  return (await response.json()) as StorageObject[];
}

function isPdf(row: StorageObject) {
  return typeof row.name === "string" && row.name.toLowerCase().endsWith(".pdf");
}

function isFolder(row: StorageObject) {
  return typeof row.name === "string" && row.id == null && row.metadata == null;
}

function fileRecord(
  row: StorageObject,
  prefix: string,
  baseUrl: string,
  bucket: string,
) {
  const name = row.name as string;
  const objectPath = joinObjectPath(prefix, name);

  return {
    name,
    objectPath,
    url: publicObjectUrl(baseUrl, bucket, objectPath),
    size: row.metadata?.size ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
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
  const configuredPrefix =
    process.env.PORTFOLIO_HACKATHON_CERTIFICATES_PREFIX?.trim() || DEFAULT_PREFIX;

  if (!secretKey) {
    return Response.json(
      {
        ok: false,
        status: "unconfigured",
        diagnostic:
          "Portfolio Supabase server credential is missing. Add PORTFOLIO_SUPABASE_SECRET_KEY (preferred) or PORTFOLIO_SUPABASE_SERVICE_ROLE_KEY to this Vercel deployment so the server can list Storage objects.",
        bucket,
        prefix: configuredPrefix,
        files: [],
      },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  try {
    const normalizedConfiguredPrefix = normalizePrefix(configuredPrefix);

    // First try the configured folder exactly as supplied.
    const directRows = await listObjects(
      baseUrl,
      bucket,
      normalizedConfiguredPrefix,
      secretKey,
    );

    let resolvedPrefix = normalizedConfiguredPrefix;
    let rows = directRows;
    const discoveredFolders = new Set<string>();

    // If Supabase returns no PDFs, inspect the bucket root. This makes the
    // integration resilient to case/spelling differences such as
    // "Hackathon certificates" vs "Hackathon Certificates".
    if (!rows.some(isPdf)) {
      const rootRows = await listObjects(baseUrl, bucket, "", secretKey);

      for (const row of rootRows) {
        if (isFolder(row) && row.name) discoveredFolders.add(row.name);
      }

      const likelyFolders = [...discoveredFolders].filter((name) =>
        /hackathon|competition|certificate/i.test(name),
      );

      const candidates = [
        normalizedConfiguredPrefix,
        ...likelyFolders,
      ].filter((value, index, values) => value && values.indexOf(value) === index);

      for (const candidate of candidates) {
        const variants = [normalizePrefix(candidate), `${normalizePrefix(candidate)}/`];

        for (const variant of variants) {
          const candidateRows = await listObjects(baseUrl, bucket, variant, secretKey);
          if (candidateRows.some(isPdf)) {
            resolvedPrefix = normalizePrefix(candidate);
            rows = candidateRows;
            break;
          }
        }

        if (rows.some(isPdf)) break;
      }
    }

    // One more level of recursion handles an accidental extra folder such as
    // "Hackathon Certificates/2026".
    if (!rows.some(isPdf)) {
      const parentRows = await listObjects(baseUrl, bucket, resolvedPrefix, secretKey);
      const childFolders = parentRows
        .filter(isFolder)
        .map((row) => row.name as string);

      for (const child of childFolders) {
        const childPrefix = joinObjectPath(resolvedPrefix, child);
        const childRows = await listObjects(baseUrl, bucket, childPrefix, secretKey);
        if (childRows.some(isPdf)) {
          resolvedPrefix = childPrefix;
          rows = childRows;
          break;
        }
      }
    }

    const files = rows
      .filter(isPdf)
      .map((row) => fileRecord(row, resolvedPrefix, baseUrl, bucket));

    return Response.json(
      {
        ok: true,
        status: "ready",
        bucket,
        prefix: configuredPrefix,
        resolvedPrefix,
        count: files.length,
        files,
        ...(files.length === 0
          ? {
              diagnostic:
                "Storage access works, but no PDFs were found at the configured path or discovered Hackathon/Certificate folders.",
              discoveredFolders: [...discoveredFolders],
            }
          : {}),
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
        prefix: configuredPrefix,
        files: [],
      },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
