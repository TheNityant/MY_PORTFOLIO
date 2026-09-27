const DEFAULT_SUPABASE_URL = "https://xlyynhcutwplyvjewqwa.supabase.co";
const PORTFOLIO_ASSET_BASE_URL =
  "https://pub-1220a4f9bd7a440ab6fc81b776a37cc9.r2.dev";

const configuredSupabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, "") ||
  DEFAULT_SUPABASE_URL;

export function portfolioAsset(bucket: string, path: string) {
  const encodedBucket = encodeURIComponent(bucket);
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${PORTFOLIO_ASSET_BASE_URL}/${encodedBucket}/${encodedPath}`;
}

export function portfolioAssetSupabaseFallback(bucket: string, path: string) {
  const encodedBucket = encodeURIComponent(bucket);
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${configuredSupabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}
