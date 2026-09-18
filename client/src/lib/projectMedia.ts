export function resolveProjectMediaSrc(src: string) {
  if (/^(?:https?:)?\/\//i.test(src) || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  return src.startsWith("/") ? src : `/${src}`;
}
