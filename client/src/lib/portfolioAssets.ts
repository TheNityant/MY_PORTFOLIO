const DEFAULT_SUPABASE_URL = "https://xlyynhcutwplyvjewqwa.supabase.co";

const configuredSupabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, "") ||
  DEFAULT_SUPABASE_URL;

export function portfolioAsset(bucket: string, path: string) {
  const encodedBucket = encodeURIComponent(bucket);
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${configuredSupabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}
