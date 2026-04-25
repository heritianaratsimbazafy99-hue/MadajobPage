const authRedirectBaseUrl = "https://madajob.local";

export function getSafeAuthRedirectPath(
  value: string | null | undefined,
  fallback = "/app"
) {
  const rawValue = value?.trim();

  if (!rawValue) {
    return fallback;
  }

  if (
    !rawValue.startsWith("/") ||
    rawValue.startsWith("//") ||
    rawValue.includes("\\") ||
    /^[a-z][a-z0-9+.-]*:/i.test(rawValue)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(rawValue, authRedirectBaseUrl);

    if (parsed.origin !== authRedirectBaseUrl) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
