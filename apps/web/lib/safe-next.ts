/** Allow local paths only; reject URL parsing tricks and sign-in redirect loops. */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(value)) return null;
  try {
    const url = new URL(value, "https://bridge.invalid");
    if (url.origin !== "https://bridge.invalid") return null;
    const pathname = decodeURIComponent(url.pathname).toLowerCase();
    if (pathname.startsWith("//") || pathname.includes("\\") || /^\/(login|auth)(\/|$)/.test(pathname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
