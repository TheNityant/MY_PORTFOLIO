const configuredBaseUrl = import.meta.env.VITE_MEDIA_BASE_URL?.trim().replace(/\/+$/, "") || "";

export function projectMediaUrl(filename: string) {
  const safeFilename = filename.replace(/^\/+/, "");

  if (configuredBaseUrl) {
    return `${configuredBaseUrl}/projects/${safeFilename}`;
  }

  return `/media/Projects/${safeFilename}`;
}
