const configuredBaseUrl = import.meta.env.VITE_MEDIA_BASE_URL?.trim().replace(/\/+$/, "") || "";

const projectMediaPrefix = /^\/?media\/Projects\//i;

export function resolveProjectMediaSrc(src: string) {
  if (/^(?:https?:)?\/\//i.test(src) || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  const normalized = src.startsWith("/") ? src : `/${src}`;

  if (!configuredBaseUrl || !projectMediaPrefix.test(src)) {
    return normalized;
  }

  const filename = src.replace(projectMediaPrefix, "");
  return `${configuredBaseUrl}/projects/${filename}`;
}
