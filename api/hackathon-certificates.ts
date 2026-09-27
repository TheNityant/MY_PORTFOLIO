const DEFAULT_PORTFOLIO_ASSET_BASE_URL =
  "https://pub-1220a4f9bd7a440ab6fc81b776a37cc9.r2.dev";
const BUCKET = "EXPERIENCE AND BLOGS";

const CERTIFICATES = [
  "ADOBE.pdf",
  "CODORA.pdf",
  "DEV_FUSION_IITBOMBAY.pdf",
  "SPIT_HACKATHON_FEB26.pdf",
] as const;

function publicObjectUrl(baseUrl: string, bucket: string, objectPath: string) {
  const encodedBucket = encodeURIComponent(bucket);
  const encodedPath = objectPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl.replace(/\/+$/, "")}/${encodedBucket}/${encodedPath}`;
}

export async function GET(_request: Request) {
  const baseUrl =
    process.env.PORTFOLIO_ASSET_BASE_URL?.trim() ||
    process.env.VITE_PORTFOLIO_ASSET_BASE_URL?.trim() ||
    DEFAULT_PORTFOLIO_ASSET_BASE_URL;

  const files = CERTIFICATES.map((name) => ({
    name,
    objectPath: name,
    url: publicObjectUrl(baseUrl, BUCKET, name),
    previewUrl: `/api/certificate-file?name=${encodeURIComponent(name)}`,
    size: null,
    createdAt: null,
    updatedAt: null,
  }));

  return Response.json(
    {
      ok: true,
      status: "ready",
      bucket: BUCKET,
      prefix: "",
      resolvedPrefix: "",
      count: files.length,
      files,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
